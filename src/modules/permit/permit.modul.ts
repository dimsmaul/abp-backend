import { PermitRepository } from './permit.repository'
import { LeaveBalanceRepository } from '../leave_balance/leave_balance.repository'
import { createPermitSchema, validatePermitSchema } from './permit.schema'
import { uploadToR2 } from '../../lib/s3'

/**
 * Count whole working days (Mon-Fri) between two dates inclusive.
 * Saturday/Sunday are skipped so weekend-spanning cuti doesn't burn extra
 * balance. Uses local-day math; both endpoints are walked one-by-one to keep
 * DST / timezone edge cases trivial.
 */
function countWorkingDays(start: Date, end: Date): number {
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  if (b < a) return 0
  let count = 0
  const cursor = new Date(a)
  while (cursor <= b) {
    const day = cursor.getDay() // 0 = Sun, 6 = Sat
    if (day !== 0 && day !== 6) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

export class PermitModule {
  private repository = new PermitRepository()
  private leaveRepo = new LeaveBalanceRepository()

  async fetchAll(query: any) {
    const page = Number(query.page || 1)
    const limit = Number(query.limit || 10)
    const status = query.status
    const userId = query.userId
    const category = query.category

    const result = await this.repository.findAll({
      page,
      limit,
      status,
      userId,
      category,
    })
    return { data: result, status: 200 }
  }

  async fetchMyPermits(userId: string) {
    const data = await this.repository.findByUserId(userId)
    return { data, status: 200 }
  }

  async fetchMyDetail(userId: string, id: string) {
    const data = await this.repository.findById(id)
    if (!data) {
      return { error: { code: 'PERMIT_NOT_FOUND', message: 'Permit not found' }, status: 404 }
    }
    if (data.userId !== userId) {
      return { error: { code: 'FORBIDDEN', message: 'Not your permit' }, status: 403 }
    }
    return { data, status: 200 }
  }

  async processCreate(userId: string, body: any) {
    // Multipart receipt upload: detect the File field BEFORE validation so we
    // can promote it to `reimburseReceiptUrl` and not trip the URL schema.
    const receipt = body?.receipt
    if (receipt && typeof receipt === 'object' && typeof receipt.arrayBuffer === 'function') {
      const file = receipt as File
      // Strict allowlist: only image MIMEs we expect from the mobile camera.
      // Extension is server-derived from the verified MIME so a hostile
      // filename like `evil.html` can't ride along.
      const ALLOWED_RECEIPT_MIME: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      }
      const MAX_RECEIPT_BYTES = 8 * 1024 * 1024 // 8 MB
      const mime = (file.type || '').toLowerCase()
      const ext = ALLOWED_RECEIPT_MIME[mime]
      if (!ext) {
        return {
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Receipt must be a JPEG, PNG, or WEBP image',
          },
          status: 400,
        }
      }
      if (typeof file.size === 'number' && file.size > MAX_RECEIPT_BYTES) {
        return {
          error: { code: 'FILE_TOO_LARGE', message: 'Receipt exceeds 8 MB' },
          status: 413,
        }
      }
      const key = `permits/reimburse/${userId}-${crypto.randomUUID()}.${ext}`
      const url = await uploadToR2(file, key, mime)
      body.reimburseReceiptUrl = url
      delete body.receipt
    }

    const validated = createPermitSchema.safeParse(body)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validated.error.flatten() }, status: 422 }
    }

    const payload = validated.data
    let daysUsed: number | null = null

    // Default category to the legacy `type` when caller doesn't send one.
    // Keeps old mobile clients working (they only submit type sick/leave/permit).
    const category = payload.category ?? payload.type

    // Per-category required-field guard. Schema keeps them optional so the
    // discriminated union doesn't blow up the existing leave/sick/permit
    // path; we enforce here.
    if (category === 'overtime' && payload.overtimeHours == null) {
      return {
        error: { code: 'OVERTIME_HOURS_REQUIRED', message: 'overtimeHours wajib diisi untuk lembur' },
        status: 422,
      }
    }
    if (category === 'reimburse' && payload.reimburseAmount == null) {
      return {
        error: { code: 'REIMBURSE_AMOUNT_REQUIRED', message: 'reimburseAmount wajib diisi untuk reimburse' },
        status: 422,
      }
    }
    if (category === 'loan' && (payload.loanAmount == null || payload.loanTenorMonths == null)) {
      return {
        error: { code: 'LOAN_FIELDS_REQUIRED', message: 'loanAmount dan loanTenorMonths wajib diisi untuk pinjaman' },
        status: 422,
      }
    }

    // 'leave' = cuti tahunan; only this type touches the balance ledger.
    if (category === 'leave') {
      daysUsed = countWorkingDays(payload.startDate, payload.endDate)
      const year = payload.startDate.getFullYear()
      const balance = await this.leaveRepo.getOrCreate(userId, year)
      const totalDays = Number(balance.total_days)
      const usedDays = Number(balance.used_days)

      if (usedDays + daysUsed > totalDays) {
        return {
          error: {
            code: 'LEAVE_BALANCE_EXCEEDED',
            message: 'Sisa cuti tidak cukup',
            details: { totalDays, usedDays, requested: daysUsed },
          },
          status: 422,
        }
      }
    }

    // Legacy DB column `type` only knows sick/leave/permit. Normalize the
    // new categories down to 'permit' on insert so direct API callers
    // (those that didn't bother with the type+category split) don't blow up
    // the enum check.
    const legacyTypes = new Set(['sick', 'leave', 'permit'])
    const legacyType = legacyTypes.has(payload.type) ? payload.type : 'permit'

    const data = await this.repository.create({
      userId,
      ...payload,
      type: legacyType,
      category,
      daysUsed,
    } as any)
    return { data, status: 201 }
  }

  async processValidate(id: string, body: any) {
    const validated = validatePermitSchema.safeParse(body)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid data' }, status: 422 }
    }

    const existing = await this.repository.findById(id)
    if (!existing) return { error: { code: 'PERMIT_NOT_FOUND', message: 'Permit not found' }, status: 404 }

    const prevStatus = existing.status
    const data = await this.repository.validate(id, validated.data)
    if (!data) return { error: { code: 'PERMIT_NOT_FOUND', message: 'Permit not found' }, status: 404 }

    // Adjust balance ledger only for cuti permits, and only when the approval
    // state actually transitions (idempotent: re-approving an approved permit
    // is a no-op so manual re-saves don't double-count).
    if (data.type === 'leave' && data.daysUsed != null) {
      const days = Number(data.daysUsed)
      const year = new Date(data.startDate).getFullYear()

      if (prevStatus !== 'approved' && data.status === 'approved') {
        await this.leaveRepo.adjustUsed(data.userId, year, days)
      } else if (prevStatus === 'approved' && data.status === 'rejected') {
        await this.leaveRepo.adjustUsed(data.userId, year, -days)
      }
    }

    return { data, status: 200 }
  }
}
