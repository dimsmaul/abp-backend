import { Generated } from 'kysely'

export interface Database {
  user: UserTable
  session: SessionTable
  account: AccountTable
  verification: VerificationTable
  attendance: AttendanceTable
  fieldReport: FieldReportTable
  reportValidation: ReportValidationTable
  office: OfficeTable
  permit: PermitTable
  leave_balance: LeaveBalanceTable
  announcement: AnnouncementTable
  user_devices: UserDeviceTable
}

export interface UserTable {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string
  role: 'employee' | 'admin' | 'manager'
  department?: string
  faceEmbedding?: string
  faceRecognitionEnabled: boolean
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
  faceScore?: number
  isLate: boolean
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

export interface OfficeTable {
  id: string
  name: string
  latitude?: number | null
  longitude?: number | null
  radius?: number | null
  address?: string | null
  zone_type: 'radius' | 'polygon'
  polygon?: number[][] | null
  province?: string | null
  regency?: string | null
  workStartTime?: string | null
  workEndTime?: string | null
  lateThresholdMinutes?: number | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

export type PermitCategory =
  | 'leave'
  | 'sick'
  | 'permit'
  | 'overtime'
  | 'reimburse'
  | 'loan'

export interface PermitTable {
  id: string
  userId: string
  type: 'sick' | 'leave' | 'permit'
  category: PermitCategory
  description: string
  startDate: Date
  endDate: Date
  attachmentUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  daysUsed?: number | null
  overtimeHours?: number | null
  reimburseAmount?: number | null
  reimburseReceiptUrl?: string | null
  loanAmount?: number | null
  loanTenorMonths?: number | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

export interface LeaveBalanceTable {
  id: Generated<string>
  user_id: string
  year: number
  total_days: number
  used_days: number
  notes?: string | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface UserDeviceTable {
  id: Generated<string>
  userId: string
  fcmToken: string
  platform: string
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

export interface AnnouncementTable {
  id: Generated<string>
  title: string
  body: string
  priority: 'low' | 'normal' | 'high'
  isPinned: boolean
  publishedBy: string
  publishedAt: Generated<Date>
  expiresAt?: Date | null
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}

