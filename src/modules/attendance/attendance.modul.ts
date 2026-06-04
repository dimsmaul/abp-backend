import { AttendanceRepository } from './attendance.repository'
import { checkInSchema, checkOutSchema, attendanceQuerySchema, recapQuerySchema, calendarQuerySchema } from './attendance.schema'
import { uploadToR2 } from '../../lib/s3'
import { OfficeRepository } from '../office/office.repository'
import { isPointInRadius, isPointInPolygon } from '../../lib/geofence'
import { watermarkPhoto } from '../../lib/watermark'
import { UserRepository } from '../user/user.repository'
import {
  InvalidEmbeddingError,
  cosineSimilarity,
  parseEmbedding,
  similarityThreshold,
} from '../../lib/face'

type FaceCheckOk = { ok: true; score: number | null }
type FaceCheckErr = {
  ok: false
  error: { code: string; message: string; details?: unknown }
  status: number
}

/**
 * Compare the candidate embedding from the request against the user's
 * enrolled embedding. Returns the similarity score so callers can persist it
 * for audit, or a structured error mirroring the rest of the module style.
 *
 * Skips silently (ok with score=null) when faceRecognitionEnabled is false —
 * keeps legacy users functional until they enroll.
 */
function verifyFace(
  user: {
    image?: string | null
    faceRecognitionEnabled?: boolean
    faceEmbedding?: string | null
  },
  candidateRaw: unknown,
): FaceCheckOk | FaceCheckErr {
  // Strict mode: face enrollment is mandatory. Distinguish two failure
  // modes so the user message actually matches reality:
  //   - no profile photo set yet → ask them to upload one
  //   - profile photo IS set but ML Kit couldn't find a face in it (the
  //     mobile auto-enroll silently produced no embedding) → tell them to
  //     re-upload a clearer face photo
  if (!user.faceEmbedding) {
    const hasAvatar = typeof user.image === 'string' && user.image.length > 0
    return {
      ok: false,
      error: {
        code: 'FACE_NOT_ENROLLED',
        message: hasAvatar
          ? 'Foto profil belum terbaca sebagai wajah. Ganti foto profil dengan foto wajah yang jelas (frontal, terang, hanya kamu).'
          : 'Belum ada foto profil. Buka profil dan unggah foto wajah Anda.',
      },
      status: 412,
    }
  }
  if (candidateRaw == null || candidateRaw === '') {
    return {
      ok: false,
      error: {
        code: 'FACE_REQUIRED',
        message: 'Embedding wajah dibutuhkan untuk presensi.',
      },
      status: 422,
    }
  }
  let candidate: number[]
  let stored: number[]
  try {
    candidate = parseEmbedding(candidateRaw)
    stored = parseEmbedding(user.faceEmbedding)
  } catch (e) {
    if (e instanceof InvalidEmbeddingError) {
      return {
        ok: false,
        error: { code: 'INVALID_EMBEDDING', message: e.message },
        status: 422,
      }
    }
    throw e
  }
  const score = cosineSimilarity(candidate, stored)
  const threshold = similarityThreshold()
  if (score < threshold) {
    return {
      ok: false,
      error: {
        code: 'FACE_MISMATCH',
        message: `Wajah tidak cocok dengan profil (skor ${score.toFixed(3)} < ${threshold}).`,
        details: { score, threshold },
      },
      status: 409,
    }
  }
  return { ok: true, score }
}

async function evaluateZone(lat: number, lng: number) {
  const officeRepo = new OfficeRepository()
  // Repository returns a paginated wrapper `{ items, page, limit, total }`,
  // so we must read `.items` (not iterate the wrapper). Limit set high
  // enough to cover the active office list in one fetch.
  const { items: offices } = await officeRepo.findAll({ page: 1, limit: 500 })

  if (offices.length === 0) {
    return { isWithinZone: true, nearestOfficeName: '', matchedOffice: null as any }
  }

  for (const office of offices) {
    const zoneType = (office as any).zone_type ?? 'radius'
    if (zoneType === 'polygon') {
      const raw = (office as any).polygon
      const poly = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (Array.isArray(poly) && isPointInPolygon(lat, lng, poly)) {
        return { isWithinZone: true, nearestOfficeName: office.name, matchedOffice: office }
      }
    } else {
      if (
        office.latitude != null &&
        office.longitude != null &&
        office.radius != null &&
        isPointInRadius(
          lat,
          lng,
          Number(office.latitude),
          Number(office.longitude),
          Number(office.radius),
        )
      ) {
        return { isWithinZone: true, nearestOfficeName: office.name, matchedOffice: office }
      }
    }
  }
  return { isWithinZone: false, nearestOfficeName: '', matchedOffice: null as any }
}

/**
 * Compute lateness against the matched office's work schedule.
 *
 * - `serverTime` is a server-side `new Date()` (UTC clock under the hood).
 * - Office `workStartTime` is stored as a TIME column representing local
 *   Asia/Jakarta (UTC+7) wall clock — no offset stored.
 * - We convert serverTime to WIB minutes-of-day and compare against the
 *   work start time + grace minutes. No office match (`matchedOffice` null)
 *   means we can't decide → not late.
 */
function computeIsLate(serverTime: Date, matchedOffice: any | null): boolean {
  if (!matchedOffice) return false
  const startStr = matchedOffice.workStartTime as string | null | undefined
  if (!startStr) return false
  const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(startStr)
  if (!m) return false
  const startMinutes = Number(m[1]) * 60 + Number(m[2])
  const threshold = Number(matchedOffice.lateThresholdMinutes ?? 0)

  // serverTime → WIB (UTC+7) minutes-of-day
  const wibMs = serverTime.getTime() + 7 * 60 * 60 * 1000
  const wib = new Date(wibMs)
  const wibMinutes = wib.getUTCHours() * 60 + wib.getUTCMinutes()

  return wibMinutes > startMinutes + threshold
}

async function fileToWatermarkedBuffer(
  photo: File,
  meta: { latitude: number; longitude: number; locationName?: string; serverTime: Date },
): Promise<Buffer> {
  const arrayBuf = await photo.arrayBuffer()
  const buf = Buffer.from(arrayBuf)
  return await watermarkPhoto(buf, meta)
}

export class AttendanceModule {
  private repository = new AttendanceRepository()

  async processCheckIn(userId: string, body: any) {
    const validated = checkInSchema.safeParse(body)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validated.error.flatten() }, status: 422 }
    }

    const todayStatus = await this.repository.findTodayStatus(userId)
    const hasCheckIn = todayStatus.some(a => a.type === 'check_in')

    if (hasCheckIn) {
      return { error: { code: 'ALREADY_CHECKED_IN', message: 'You have already checked in today' }, status: 409 }
    }

    const photo = body['photo'] as File
    if (!photo) {
      return { error: { code: 'MISSING_PHOTO', message: 'Photo is required' }, status: 422 }
    }

    // --- Geofencing Validation ---
    const { isWithinZone, nearestOfficeName, matchedOffice } = await evaluateZone(
      validated.data.latitude,
      validated.data.longitude,
    )

    // --- Face Recognition (cosine similarity vs enrolled embedding) ---
    const userRepo = new UserRepository()
    const user = await userRepo.findById(userId)

    const face = verifyFace(user ?? {}, body['faceEmbedding'])
    if (!face.ok) {
      return { error: face.error, status: face.status }
    }

    const serverTime = new Date()
    const locationName = nearestOfficeName || "Field (Outside Zone)"
    const isLate = computeIsLate(serverTime, matchedOffice)

    const watermarked = await fileToWatermarkedBuffer(photo, {
      latitude: validated.data.latitude,
      longitude: validated.data.longitude,
      locationName,
      serverTime,
    })

    const key = `attendance/check-in/${userId}-${crypto.randomUUID()}.jpg`
    const photoUrl = await uploadToR2(watermarked, key, 'image/jpeg')

    const data = await this.repository.create({
      id: crypto.randomUUID(),
      userId: userId,
      type: 'check_in',
      photoUrl,
      latitude: validated.data.latitude,
      longitude: validated.data.longitude,
      locationName,
      isWithinZone,
      serverTime,
      isLate,
      ...(face.score !== null ? { faceScore: face.score } : {}),
    })

    return { data, status: 201 }
  }

  async processCheckOut(userId: string, body: any) {
    const validated = checkOutSchema.safeParse(body)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validated.error.flatten() }, status: 422 }
    }

    const todayStatus = await this.repository.findTodayStatus(userId)
    const hasCheckIn = todayStatus.some(a => a.type === 'check_in')
    const hasCheckOut = todayStatus.some(a => a.type === 'check_out')

    if (!hasCheckIn) {
      return { error: { code: 'NO_ACTIVE_CHECK_IN', message: 'You have not checked in today' }, status: 409 }
    }

    if (hasCheckOut) {
      return { error: { code: 'ALREADY_CHECKED_OUT', message: 'You have already checked out today' }, status: 409 }
    }

    const photo = body['photo'] as File
    if (!photo) {
      return { error: { code: 'MISSING_PHOTO', message: 'Photo is required' }, status: 422 }
    }

    // --- Geofencing Validation (Same as Check-In) ---
    const { isWithinZone, nearestOfficeName } = await evaluateZone(
      validated.data.latitude,
      validated.data.longitude,
    )
    // check-out doesn't recompute isLate; the check-in row owns that flag.

    // --- Face Recognition (Same gate as Check-In) ---
    const userRepo = new UserRepository()
    const user = await userRepo.findById(userId)

    const face = verifyFace(user ?? {}, body['faceEmbedding'])
    if (!face.ok) {
      return { error: face.error, status: face.status }
    }

    const serverTime = new Date()
    const locationName = nearestOfficeName || "Field (Outside Zone)"

    const watermarked = await fileToWatermarkedBuffer(photo, {
      latitude: validated.data.latitude,
      longitude: validated.data.longitude,
      locationName,
      serverTime,
    })

    const key = `attendance/check-out/${userId}-${crypto.randomUUID()}.jpg`
    const photoUrl = await uploadToR2(watermarked, key, 'image/jpeg')

    const data = await this.repository.create({
      id: crypto.randomUUID(),
      userId: userId,
      type: 'check_out',
      photoUrl,
      latitude: validated.data.latitude,
      longitude: validated.data.longitude,
      locationName,
      isWithinZone,
      serverTime,
      isLate: false,
      ...(face.score !== null ? { faceScore: face.score } : {}),
    })

    return { data, status: 201 }
  }

  async fetchHistory(userId: string, query: any) {
    const validated = attendanceQuerySchema.safeParse(query)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' }, status: 422 }
    }

    const result = await this.repository.findAll({
      ...validated.data,
      userId: userId
    })

    return { data: result, status: 200 }
  }

  async fetchAllHistory(query: any) {
    const validated = attendanceQuerySchema.safeParse(query)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' }, status: 422 }
    }

    const result = await this.repository.findAll(validated.data)

    return { data: result, status: 200 }
  }

  async fetchRecap(query: any) {
    const validated = recapQuerySchema.safeParse(query)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'from and to dates are required' }, status: 422 }
    }

    const rawData = await this.repository.findRecapData(validated.data)

    // Group by user
    const userMap = new Map<string, {
      user: { id: string; name: string; department: string | undefined }
      records: { date: string; type: string; serverTime: Date; isWithinZone: boolean }[]
    }>()

    for (const row of rawData) {
      if (!userMap.has(row.userId)) {
        userMap.set(row.userId, {
          user: { id: row.userId, name: row.userName, department: row.userDepartment ?? undefined },
          records: []
        })
      }
      const dateStr = new Date(row.serverTime).toISOString().split('T')[0]
      userMap.get(row.userId)!.records.push({
        date: dateStr,
        type: row.type,
        serverTime: row.serverTime,
        isWithinZone: row.isWithinZone,
      })
    }

    // Calculate work hours per user
    const fromDate = new Date(validated.data.from)
    const toDate = new Date(validated.data.to)
    const totalDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const items = Array.from(userMap.values()).map(({ user, records }) => {
      // Group records by date
      const dateMap = new Map<string, { checkIn?: Date; checkOut?: Date; isWithinZone: boolean }>()
      for (const rec of records) {
        if (!dateMap.has(rec.date)) {
          dateMap.set(rec.date, { isWithinZone: rec.isWithinZone })
        }
        const entry = dateMap.get(rec.date)!
        if (rec.type === 'check_in') entry.checkIn = new Date(rec.serverTime)
        if (rec.type === 'check_out') entry.checkOut = new Date(rec.serverTime)
      }

      let totalMinutes = 0
      const details: any[] = []

      for (const [date, entry] of dateMap.entries()) {
        let workDuration = '-'
        if (entry.checkIn && entry.checkOut) {
          const diffMs = entry.checkOut.getTime() - entry.checkIn.getTime()
          const mins = Math.floor(diffMs / 60000)
          totalMinutes += mins
          const hours = Math.floor(mins / 60)
          const remainMins = mins % 60
          workDuration = `${hours}h ${remainMins}m`
        }

        details.push({
          date,
          checkIn: entry.checkIn ? entry.checkIn.toISOString().split('T')[1].substring(0, 8) : null,
          checkOut: entry.checkOut ? entry.checkOut.toISOString().split('T')[1].substring(0, 8) : null,
          workDuration,
          isWithinZone: entry.isWithinZone,
        })
      }

      const presentDays = dateMap.size
      const absentDays = totalDays - presentDays
      const totalHours = Math.floor(totalMinutes / 60)
      const totalRemainMins = totalMinutes % 60
      const avgMins = presentDays > 0 ? Math.floor(totalMinutes / presentDays) : 0
      const avgHours = Math.floor(avgMins / 60)
      const avgRemainMins = avgMins % 60

      return {
        user,
        summary: {
          totalDays,
          presentDays,
          absentDays,
          totalWorkHours: `${totalHours}h ${totalRemainMins}m`,
          avgWorkHours: `${avgHours}h ${avgRemainMins}m`,
        },
        details,
      }
    })

    return { data: { items }, status: 200 }
  }

  /**
   * Build a per-day calendar for the user's attendance in a given month.
   *
   * Status rules:
   *   - `holiday` → Sat/Sun (weekend); skipped, no attendance expected.
   *   - `present` → has check_in record, not flagged late.
   *   - `late`    → has check_in record, isLate === true.
   *   - `absent`  → weekday without any check_in. Future dates in the
   *                 current month are also reported as `absent`; the FE
   *                 can decide whether to render them or hide.
   *
   * Dates are emitted in WIB (UTC+7) calendar terms so the mobile day
   * grouping matches what the user sees on the lock screen.
   */
  async fetchCalendar(userId: string, query: any) {
    const validated = calendarQuerySchema.safeParse(query)
    if (!validated.success) {
      return { error: { code: 'VALIDATION_ERROR', message: 'Invalid month' }, status: 422 }
    }

    const [yearStr, monthStr] = validated.data.month.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr) // 1-12

    // Month boundaries in WIB. WIB midnight 1st is UTC 17:00 of the
    // previous day; we use that as the lower bound so a 00:30 WIB check-in
    // (UTC 17:30 prev day) is still considered the 1st.
    const wibOffsetMs = 7 * 60 * 60 * 1000
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0) - wibOffsetMs)
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0) - wibOffsetMs - 1)

    const rows = await this.repository.findMonthlyByUser(userId, start, end)

    // Group rows per WIB date.
    const byDate = new Map<string, { checkIn?: Date; checkOut?: Date; isLate: boolean }>()
    for (const r of rows) {
      const wib = new Date(new Date(r.serverTime).getTime() + wibOffsetMs)
      const dateStr = `${wib.getUTCFullYear()}-${String(wib.getUTCMonth() + 1).padStart(2, '0')}-${String(wib.getUTCDate()).padStart(2, '0')}`
      const entry = byDate.get(dateStr) ?? { isLate: false }
      if (r.type === 'check_in') {
        entry.checkIn = new Date(r.serverTime)
        entry.isLate = entry.isLate || !!r.isLate
      } else if (r.type === 'check_out') {
        entry.checkOut = new Date(r.serverTime)
      }
      byDate.set(dateStr, entry)
    }

    const daysInMonth = new Date(year, month, 0).getDate()
    const data: Array<{
      date: string
      status: 'present' | 'late' | 'absent' | 'holiday'
      checkIn?: string
      checkOut?: string
    }> = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      // getDay() against (year, month-1, d) — JS Date built in local TZ.
      // The day-of-week math doesn't depend on hour, so it's stable across
      // server/client timezones.
      const dow = new Date(year, month - 1, d).getDay()
      const isWeekend = dow === 0 || dow === 6

      const entry = byDate.get(dateStr)
      if (isWeekend && !entry) {
        data.push({ date: dateStr, status: 'holiday' })
        continue
      }
      if (entry?.checkIn) {
        data.push({
          date: dateStr,
          status: entry.isLate ? 'late' : 'present',
          checkIn: entry.checkIn.toISOString(),
          checkOut: entry.checkOut?.toISOString(),
        })
      } else {
        data.push({ date: dateStr, status: isWeekend ? 'holiday' : 'absent' })
      }
    }

    return { data: { items: data }, status: 200 }
  }

  async fetchMapPoints(dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date()
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const points = await this.repository.findMapPoints(startOfDay, endOfDay)

    return { data: { points }, status: 200 }
  }
}
