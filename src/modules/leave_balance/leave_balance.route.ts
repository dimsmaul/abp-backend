import { Hono } from 'hono'
import { LeaveBalanceController } from './leave_balance.controller'
import { authGuard, roleGuard } from '../../lib/rbac'

const leaveBalance = new Hono()
const controller = new LeaveBalanceController()

leaveBalance.get('/mobile/me/leave-balance', authGuard(), (c) => controller.findMine(c))
leaveBalance.get('/web/leave-balances', roleGuard(['admin']), (c) => controller.findAll(c))
leaveBalance.patch('/web/leave-balances/:userId', roleGuard(['admin']), (c) => controller.update(c))

export default leaveBalance
