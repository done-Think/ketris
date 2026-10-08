export type Role = 'ADMIN' | 'OWNER' | 'AGENT' | 'RENTER'

export interface AdminUser {
  id: string
  tenantId: string
  name: string
  email: string
  role: Role
  active: boolean
}

export interface CreateAdminPayload {
  name: string
  email: string
  password: string
}

export interface UpdateAdminPayload {
  name?: string
  email?: string
}

export interface CreateAdminResponse {
  user: AdminUser
}

export interface ListAdminsResponse {
  admins: AdminUser[]
}

export interface GetAdminResponse {
  admin: AdminUser
}

export interface UpdateAdminResponse {
  admin: AdminUser
}

export interface DeactivateAdminResponse {
  admin: AdminUser
}

export type EditAdminFormProps = {
  adminId: string
}

export interface CreateAdminInput {
  name: string
  email: string
  password: string
}

export interface UpdateAdminInput {
  id: string
  name?: string
  email?: string
}
