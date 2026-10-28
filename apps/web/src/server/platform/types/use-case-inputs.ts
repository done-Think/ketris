import type { AuthenticatedPlatformAdmin, PlatformAdminRole } from './platform-admin'
import type { AuthenticatedUser } from '../../auth/types/authenticated-user'
import type { NewTenant } from './tenant-repository'
import type { TenantSummary } from './tenant-summary'
import type { BillingSummary } from './platform-billing'
import type { ChargedPlatformTenant } from './platform-tenant'
import type { PlatformPlan } from './platform-plan'
import type { PlatformPlanActor, PlatformPlanPrices } from './platform-plan-repository'
import type { TenantAccountType } from './tenant-account'
import type { TenantStatus } from './tenant-account'

export interface CreatePlatformAdminInput {
  actorId: string
  name: string
  email: string
  password: string
  role: PlatformAdminRole
}

export type CreatePlatformAdminOutput = AuthenticatedPlatformAdmin

export interface CreateTenantAdminInput {
  actorId?: string
  tenantId: string
  name: string
  email: string
  password: string
}

export type CreateTenantAdminOutput = AuthenticatedUser

export type CreateTenantInput = NewTenant

export type CreateTenantOutput = TenantSummary

export interface DeactivatePlatformAdminInput {
  actorId: string
  platformAdminId: string
}

export type DeactivatePlatformAdminOutput = AuthenticatedPlatformAdmin

export interface GetPlatformAdminInput {
  platformAdminId: string
}

export type GetPlatformAdminOutput = AuthenticatedPlatformAdmin

export interface PlatformFinance extends BillingSummary {
  referenceDate: Date
  accounts: ChargedPlatformTenant[]
}

export type ListPlatformAdminsOutput = AuthenticatedPlatformAdmin[]

export interface PlatformPlanWithAccounts extends PlatformPlan {
  activeAccounts: number
}

export interface ListTenantUsersInput {
  tenantId: string
  page: number
  pageSize: number
}

export interface ListTenantUsersOutput {
  items: AuthenticatedUser[]
  totalCount: number
  page: number
  pageSize: number
}

export interface LoginPlatformAdminInput {
  email: string
  password: string
}

export interface LoginPlatformAdminOutput {
  admin: AuthenticatedPlatformAdmin
  accessToken: string
  refreshToken: string
}

export interface RefreshPlatformAdminTokenInput {
  refreshToken: string
}

export interface RefreshPlatformAdminTokenOutput {
  accessToken: string
  refreshToken: string
}

export interface UpdatePlatformAdminInput {
  actorId: string
  platformAdminId: string
  name?: string
  email?: string
  role?: PlatformAdminRole
  active?: true
}

export type UpdatePlatformAdminOutput = AuthenticatedPlatformAdmin

export interface UpdatePlatformPlanInput extends PlatformPlanPrices {
  accountType: TenantAccountType
  actor: PlatformPlanActor
}

export interface UpdateTenantAccountInput {
  tenantId: string
  accountType: TenantAccountType
  status: TenantStatus
  actorId: string | null
}
