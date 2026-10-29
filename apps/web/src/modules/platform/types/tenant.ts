import type { components, paths } from '@shared/types/generated/api'
import type { z } from 'zod'

import type { createTenantAdminSchema } from '../schemas/create-tenant-admin-schema'
import type { createTenantSchema } from '../schemas/create-tenant-schema'
import type { createTenantAccountSchema } from '../schemas/tenant-account-schema'
import type { ApiPlatformPlan } from './platform-plan'

export type CreateTenantFormValues = z.infer<ReturnType<typeof createTenantSchema>>

export type CreateTenantAdminFormValues = z.infer<ReturnType<typeof createTenantAdminSchema>>

export type TenantSummary = components['schemas']['TenantSummary']

export const TENANT_ACCOUNT_TYPES = ['INDIVIDUAL', 'BROKER', 'AGENCY'] as const
export type TenantAccountType = components['schemas']['PlatformTenant']['accountType']

export const TENANT_STATUSES = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELED'] as const
export type TenantStatus = components['schemas']['PlatformTenant']['status']

export type PlatformTenant = components['schemas']['PlatformTenant']

export type TenantAccountFormValues = z.infer<ReturnType<typeof createTenantAccountSchema>>

export type UpdateTenantAccountPayload = components['schemas']['UpdateTenantAccountRequest']

export type UpdateTenantAccountResponse = components['schemas']['UpdateTenantAccountResponse']

export interface EditTenantAccountDialogProps {
  tenant: PlatformTenant
  onClose: () => void
}

export type TenantUserRole =
  components['schemas']['ListTenantUsersResponse']['users'][number]['role']

export type TenantUser = components['schemas']['ListTenantUsersResponse']['users'][number]

export type CreateTenantPayload = components['schemas']['CreateTenantRequest']

export type CreateTenantAdminPayload = components['schemas']['CreateTenantAdminRequest']

export type TenantStatusCounts = components['schemas']['ListTenantsResponse']['statusCounts']

export type TenantListQuery = NonNullable<paths['/platform/tenants']['get']['parameters']['query']>

export type PageMeta = Pick<ListTenantsResponse, 'totalCount' | 'page' | 'pageSize'>

export type ListTenantsResponse = components['schemas']['ListTenantsResponse']

export type TenantPage = ListTenantsResponse

export type GetTenantResponse = components['schemas']['GetPlatformTenantResponse']

export type TenantUsersPage = components['schemas']['ListTenantUsersResponse']

export type CreateTenantResponse = components['schemas']['CreateTenantResponse']

export type ListTenantUsersResponse = components['schemas']['ListTenantUsersResponse']

export type CreateTenantAdminResponse = components['schemas']['CreateTenantAdminResponse']

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

export type StatusFilter = 'ALL' | TenantStatus

export type TenantTypeFilter = 'ALL' | TenantAccountType

export interface TenantsListFilters {
  query: string
  accountType: TenantTypeFilter
  onClear: () => void
}

export interface TenantsListProps {
  filters?: TenantsListFilters
}

export interface TenantsListState {
  status: StatusFilter
  page: number
  pageSize: number
  scope: string
}

export interface TenantUsersListState {
  page: number
  pageSize: number
}

export interface TenantsFiltersProps {
  query: string
  accountType: TenantTypeFilter
  onQueryChange: (query: string) => void
  onAccountTypeChange: (accountType: TenantTypeFilter) => void
}

export interface CreateTenantSummaryProps {
  name: string
  slug: string
  accountType: TenantAccountType
  status: 'TRIAL' | 'ACTIVE'
  plan: ApiPlatformPlan | undefined
}
