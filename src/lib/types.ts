import { Generated } from 'kysely'

export interface Database {
  user: UserTable
  session: SessionTable
  account: AccountTable
  verification: VerificationTable
  attendance: AttendanceTable
  fieldReport: FieldReportTable
  reportValidation: ReportValidationTable
}

export interface UserTable {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string
  role: 'employee' | 'admin' | 'manager'
  department?: string
  createdAt: Date
  updatedAt: Date
}

export interface SessionTable {
  id: string
  expiresAt: Date
  token: string
  createdAt: Date
  updatedAt: Date
  ipAddress?: string
  userAgent?: string
  userId: string
}

export interface AccountTable {
  id: string
  accountId: string
  providerId: string
  userId: string
  accessToken?: string
  refreshToken?: string
  idToken?: string
  accessTokenExpiresAt?: Date
  refreshTokenExpiresAt?: Date
  scope?: string
  password?: string
  createdAt: Date
  updatedAt: Date
}

export interface VerificationTable {
  id: string
  identifier: string
  value: string
  expiresAt: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface AttendanceTable {
  id: string
  userId: string
  type: 'check_in' | 'check_out'
  photoUrl: string
  latitude: number
  longitude: number
  locationName?: string
  isWithinZone: boolean
  serverTime: Date
  createdAt: Generated<Date>
}

export interface FieldReportTable {
  id: string
  userId: string
  category: 'weather' | 'technical' | 'progress' | 'other'
  description: string
  photoUrl: string
  latitude: number
  longitude: number
  status: 'pending' | 'approved' | 'rejected' | 'need_revision'
  createdAt: Generated<Date>
}

export interface ReportValidationTable {
  id: string
  reportId: string
  validatedBy: string
  status: 'approved' | 'rejected' | 'need_revision'
  notes?: string
  validatedAt: Generated<Date>
}

