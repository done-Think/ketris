export type Role = 'ADMIN' | 'OWNER' | 'AGENT'

export interface AdminUser {
  id: string
  tenantId: string
  name: string
  email: string
  role: Role
  active: boolean
}
