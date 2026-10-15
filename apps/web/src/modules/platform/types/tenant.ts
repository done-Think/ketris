import type { z } from 'zod'

import type { createTenantAdminSchema } from '../schemas/create-tenant-admin-schema'
import type { createTenantSchema } from '../schemas/create-tenant-schema'
import type { createTenantAccountSchema } from '../schemas/tenant-account-schema'
import type { MonthlyCharge } from './platform-plan'

export type CreateTenantFormValues = z.infer<ReturnType<typeof createTenantSchema>>

export type CreateTenantAdminFormValues = z.infer<ReturnType<typeof createTenantAdminSchema>>

export interface TenantSummary {
  id: string
  name: string
  slug: string
  createdAt: string
}

export const TENANT_ACCOUNT_TYPES = ['INDIVIDUAL', 'BROKER', 'AGENCY'] as const
export type TenantAccountType = (typeof TENANT_ACCOUNT_TYPES)[number]

export const TENANT_STATUSES = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELED'] as const
export type TenantStatus = (typeof TENANT_STATUSES)[number]

// A tenant with how the platform bills it (kept manually by a platform admin).
export interface PlatformTenant extends TenantSummary {
  accountType: TenantAccountType
  status: TenantStatus
  canceledAt: string | null
  // What its plan costs for its current usage; null for the renters' system tenant.
  monthlyCharge?: MonthlyCharge | null
}

export type TenantAccountFormValues = z.infer<ReturnType<typeof createTenantAccountSchema>>

export interface UpdateTenantAccountPayload {
  accountType: TenantAccountType
  status: TenantStatus
}

export interface UpdateTenantAccountResponse {
  tenant: PlatformTenant
}

export interface EditTenantAccountDialogProps {
  tenant: PlatformTenant
  onClose: () => void
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
  accountType?: TenantAccountType
  status?: 'TRIAL' | 'ACTIVE'
}

export interface CreateTenantAdminPayload {
  name: string
  email: string
  password: string
}

export interface ListTenantsResponse {
  tenants: PlatformTenant[]
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

export type CreateTenantInput = CreateTenantPayload

export interface CreateTenantAdminInput {
  tenantId: string
  name: string
  email: string
  password: string
}
