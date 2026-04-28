import { AttendanceRepository } from './attendance.repository'
import { checkInSchema, checkOutSchema, attendanceQuerySchema } from './attendance.schema'
import { uploadToR2 } from '../../lib/s3'

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

    const key = `attendance/check-in/${userId}-${crypto.randomUUID()}.jpg`
    const photoUrl = await uploadToR2(photo, key)
    
    const locationName = "Jl. Mock Location, Jakarta" 
    
    const data = await this.repository.create({
      id: crypto.randomUUID(),
      userId: userId,
      type: 'check_in',
      photoUrl,
      latitude: validated.data.latitude,
      longitude: validated.data.longitude,
      locationName,
      isWithinZone: true, 
      serverTime: new Date(),
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

    const key = `attendance/check-out/${userId}-${crypto.randomUUID()}.jpg`
    const photoUrl = await uploadToR2(photo, key)

    const locationName = "Jl. Mock Location, Jakarta"

    const data = await this.repository.create({
      id: crypto.randomUUID(),
      userId: userId,
      type: 'check_out',
      photoUrl,
      latitude: validated.data.latitude,
      longitude: validated.data.longitude,
      locationName,
      isWithinZone: true,
      serverTime: new Date(),
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
}
