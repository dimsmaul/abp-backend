import { AttendanceRepository } from './attendance.repository'
import { checkInSchema, checkOutSchema, attendanceQuerySchema, recapQuerySchema } from './attendance.schema'
import { uploadToR2 } from '../../lib/s3'
import { OfficeRepository } from '../office/office.repository'
import { calculateDistance } from '../../lib/geo'
import { UserRepository } from '../user/user.repository'

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
    const officeRepo = new OfficeRepository()
    const offices = await officeRepo.findAll()
    
    let isWithinZone = false
    let nearestOfficeName = ""

    if (offices.length === 0) {
      // If no offices defined, default to true or some other policy
      isWithinZone = true 
    } else {
      for (const office of offices) {
        const distance = calculateDistance(
          validated.data.latitude,
          validated.data.longitude,
          Number(office.latitude),
          Number(office.longitude)
        )
        if (distance <= office.radius) {
          isWithinZone = true
          nearestOfficeName = office.name
          break
        }
      }
    }

    // --- Face Recognition Scaffolding ---
    const userRepo = new UserRepository()
    const user = await userRepo.findById(userId)
    
    if (user?.faceRecognitionEnabled) {
      // TODO: Implement actual face recognition logic here
      // For now, we assume it's valid if the photo is present
      console.log(`[FaceRecognition] Checking face for user ${userId}`)
    }

    const key = `attendance/check-in/${userId}-${crypto.randomUUID()}.jpg`
    const photoUrl = await uploadToR2(photo, key)
    
    const locationName = nearestOfficeName || "Field (Outside Zone)"
    
    const data = await this.repository.create({
      id: crypto.randomUUID(),
      userId: userId,
      type: 'check_in',
      photoUrl,
      latitude: validated.data.latitude,
      longitude: validated.data.longitude,
      locationName,
      isWithinZone, 
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

    // --- Geofencing Validation (Same as Check-In) ---
    const officeRepo = new OfficeRepository()
    const offices = await officeRepo.findAll()
    
    let isWithinZone = false
    let nearestOfficeName = ""

    if (offices.length === 0) {
      isWithinZone = true 
    } else {
      for (const office of offices) {
        const distance = calculateDistance(
          validated.data.latitude,
          validated.data.longitude,
          Number(office.latitude),
          Number(office.longitude)
        )
        if (distance <= office.radius) {
          isWithinZone = true
          nearestOfficeName = office.name
          break
        }
      }
    }

    const key = `attendance/check-out/${userId}-${crypto.randomUUID()}.jpg`
    const photoUrl = await uploadToR2(photo, key)

    const locationName = nearestOfficeName || "Field (Outside Zone)"

    const data = await this.repository.create({
      id: crypto.randomUUID(),
      userId: userId,
      type: 'check_out',
      photoUrl,
      latitude: validated.data.latitude,
      longitude: validated.data.longitude,
      locationName,
      isWithinZone,
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
