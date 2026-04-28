import { Hono } from 'hono'
import { AttendanceController } from './attendance.controller'
import { roleGuard } from '../../lib/rbac'

const attendance = new Hono()
const controller = new AttendanceController()

// Mobile endpoints
attendance.post('/mobile/attendances/check-in', roleGuard(['employee']), (c) => controller.checkIn(c))
attendance.post('/mobile/attendances/check-out', roleGuard(['employee']), (c) => controller.checkOut(c))
attendance.get('/mobile/attendances', roleGuard(['employee']), (c) => controller.getMyHistory(c))

// Web endpoints
attendance.get('/web/attendances', roleGuard(['manager', 'admin']), (c) => controller.getAllHistory(c))

export default attendance
