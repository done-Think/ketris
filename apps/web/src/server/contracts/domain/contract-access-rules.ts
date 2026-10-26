import { isAgencyManager, isPropertyOwner } from '@server/auth/domain/roles'
import type { Papel } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'
import type { ContractManageScope, ContractReadScope } from '../types/contract-entity'
import { ContractRenterForbiddenError } from './errors'

export function resolveContractManageScope(actorId: string, papel: Papel): ContractManageScope {
  if (isAgencyManager(papel)) return {}
  if (papel === 'AGENT') return { responsibleId: actorId }
  if (papel === 'RENTER') throw new ContractRenterForbiddenError()

  throw new ForbiddenError()
}

export function resolveContractReadScope(
  actorTenantId: string,
  actorId: string,
  papel: Papel,
): ContractReadScope {
  if (papel === 'RENTER') return { kind: 'party', userId: actorId }
  if (isPropertyOwner(papel)) {
    return { kind: 'propertyOwner', tenantId: actorTenantId, ownerId: actorId }
  }

  return { kind: 'tenant', tenantId: actorTenantId, ...resolveContractManageScope(actorId, papel) }
}
