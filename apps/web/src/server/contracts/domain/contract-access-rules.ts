import type { Papel } from '@server/auth/domain/user.entity'

import type { ContractAccessScope } from './contract.entity'
import { ContractRenterForbiddenError } from './errors'

export function resolveContractAccessScope(actorId: string, papel: Papel): ContractAccessScope {
  if (papel === 'RENTER') {
    throw new ContractRenterForbiddenError()
  }

  return papel === 'AGENT' ? { responsibleId: actorId } : {}
}
