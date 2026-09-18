export type Role = 'ADMIN' | 'OWNER' | 'AGENT' | 'RENTER'

export interface AdminUser {
  id: string
  tenantId: string
  name: string
  email: string
  role: Role
  active: boolean
}
