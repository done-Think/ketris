import type { TenantAccountType } from './tenant-account'

export interface NewTenant {
  nome: string
  slug: string
  accountType?: TenantAccountType
  status?: 'TRIAL' | 'ACTIVE'
}
