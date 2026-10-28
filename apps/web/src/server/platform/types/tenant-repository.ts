import type { TenantAccountType } from './tenant-account'

export interface NewTenant {
  name: string
  slug: string
  accountType?: TenantAccountType
  status?: 'TRIAL' | 'ACTIVE'
}
