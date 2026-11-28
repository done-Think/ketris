import type { User } from '@server/auth/domain/user.entity'
import type { TenantAccountType } from '@server/auth/types/user-access'

export interface RenterParty {
  role: string
  email: string
  userId: string | null
}

export type RenterAccount = Pick<User, 'id' | 'email' | 'active' | 'role'>

export type ContractRenterCandidate = RenterAccount &
  Pick<User, 'tenantId'> & { tenantAccountType?: TenantAccountType }
