import type { z } from 'zod'

import type { createAdminSchema } from '../schemas/create-admin-schema'
import type { createUpdateAdminSchema } from '../schemas/update-admin-schema'

export type Role = 'ADMIN' | 'OWNER' | 'AGENT' | 'RENTER'

export type CreateAdminFormValues = z.infer<ReturnType<typeof createAdminSchema>>

export type UpdateAdminFormValues = z.infer<ReturnType<typeof createUpdateAdminSchema>>

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
