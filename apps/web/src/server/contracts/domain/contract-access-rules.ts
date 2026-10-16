import type { Papel } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'

import type { ContractAccessScope } from './contract.entity'
import { ContractRenterForbiddenError } from './errors'

export function resolveContractAccessScope(actorId: string, papel: Papel): ContractAccessScope {
  if (papel === 'ADMIN' || papel === 'OWNER') return {}
  if (papel === 'AGENT') return { responsibleId: actorId }
  if (papel === 'RENTER') throw new ContractRenterForbiddenError()

  throw new ForbiddenError()
}
