import type { components } from '@shared/types/generated/api'

export type TenantAgent = Pick<
  components['schemas']['AuthenticatedUserResponse'],
  'id' | 'name' | 'email' | 'role' | 'active'
>

export type ListTenantUsersResponse = Pick<components['schemas']['ListUsersResponse'], 'users'>
