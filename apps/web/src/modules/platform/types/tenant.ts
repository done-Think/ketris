import type { z } from 'zod'

import type { createTenantAdminSchema } from '../schemas/create-tenant-admin-schema'
import type { createTenantSchema } from '../schemas/create-tenant-schema'

export type CreateTenantFormValues = z.infer<ReturnType<typeof createTenantSchema>>

export type CreateTenantAdminFormValues = z.infer<ReturnType<typeof createTenantAdminSchema>>

export interface TenantSummary {
  id: string
  name: string
  slug: string
  createdAt: string
}

export type TenantUserRole = 'ADMIN' | 'OWNER' | 'AGENT' | 'RENTER'

export interface TenantUser {
  id: string
  tenantId: string
  name: string
  email: string
  avatarUrl: string | null
  role: TenantUserRole
  active: boolean
  pendingApproval: boolean
}

export interface CreateTenantPayload {
  name: string
  slug: string
}

export interface CreateTenantAdminPayload {
  name: string
  email: string
  password: string
}

export interface ListTenantsResponse {
  tenants: TenantSummary[]
}

export interface CreateTenantResponse {
  tenant: TenantSummary
}

export interface ListTenantUsersResponse {
  users: TenantUser[]
}

export interface CreateTenantAdminResponse {
  user: TenantUser
}

export type TenantUsersListProps = {
  tenantId: string
}

export type CreateTenantAdminFormProps = {
  tenantId: string
}

export interface CreateTenantInput {
  name: string
  slug: string
}

export interface CreateTenantAdminInput {
  tenantId: string
  name: string
  email: string
  password: string
}
