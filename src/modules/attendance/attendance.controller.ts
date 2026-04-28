import { Context } from 'hono'
import { AttendanceRepository } from './attendance.repository'
import { checkInSchema, checkOutSchema, attendanceQuerySchema } from './attendance.schema'
import { crypto } from 'bun'

export class AttendanceController {
  private repository = new AttendanceRepository()

  async checkIn(c: Context) {
    const user = c.get('user')
    const body = await c.req.parseBody()
    
    const validated = checkInSchema.safeParse(body)
    if (!validated.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validated.error.flatten() } }, 422)
    }

    const todayStatus = await this.repository.findTodayStatus(user.id)
    const hasCheckIn = todayStatus.some(a => a.type === 'check_in')

    if (hasCheckIn) {
      return c.json({ error: { code: 'ALREADY_CHECKED_IN', message: 'You have already checked in today' } }, 409)
    }

    // Mock photo processing & geocoding
    const photoUrl = `https://storage.fieldtrack.com/watermarked-${crypto.randomUUIDv7()}.jpg`
    const locationName = "Jl. Mock Location, Jakarta" 
    
    const data = await this.repository.create({
      id: crypto.randomUUIDv7(),
      userId: user.id,
      type: 'check_in',
      photoUrl,
      latitude: validated.data.latitude,
      longitude: validated.data.longitude,
      locationName,
      isWithinZone: true, // Mock logic
      serverTime: new Date(),
    })

    return c.json({ data }, 201)
  }

  async checkOut(c: Context) {
    const user = c.get('user')
    const body = await c.req.parseBody()
    
    const validated = checkOutSchema.safeParse(body)
    if (!validated.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validated.error.flatten() } }, 422)
    }

    const todayStatus = await this.repository.findTodayStatus(user.id)
    const hasCheckIn = todayStatus.some(a => a.type === 'check_in')
    const hasCheckOut = todayStatus.some(a => a.type === 'check_out')

    if (!hasCheckIn) {
      return c.json({ error: { code: 'NO_ACTIVE_CHECK_IN', message: 'You have not checked in today' } }, 409)
    }

    if (hasCheckOut) {
      return c.json({ error: { code: 'ALREADY_CHECKED_OUT', message: 'You have already checked out today' } }, 409)
    }

    const photoUrl = `https://storage.fieldtrack.com/watermarked-${crypto.randomUUIDv7()}.jpg`
    const locationName = "Jl. Mock Location, Jakarta"

    const data = await this.repository.create({
      id: crypto.randomUUIDv7(),
      userId: user.id,
      type: 'check_out',
      photoUrl,
      latitude: validated.data.latitude,
      longitude: validated.data.longitude,
      locationName,
      isWithinZone: true,
      serverTime: new Date(),
    })

    return c.json({ data }, 201)
  }

  async getMyHistory(c: Context) {
    const user = c.get('user')
    const query = c.req.query()
    const validated = attendanceQuerySchema.safeParse(query)
    
    if (!validated.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' } }, 422)
    }

    const result = await this.repository.findAll({
      ...validated.data,
      userId: user.id
    })

    return c.json({ data: result })
  }

  async getAllHistory(c: Context) {
    const query = c.req.query()
    const validated = attendanceQuerySchema.safeParse(query)
    
    if (!validated.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' } }, 422)
    }

    const result = await this.repository.findAll(validated.data)

    return c.json({ data: result })
  }
}
