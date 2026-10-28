import { isAgencyManager, isPropertyOwner } from '@server/auth/domain/roles'
import type { UserRole } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'
import type { ContractManageScope, ContractReadScope } from '../types/contract-entity'
import { ContractRenterForbiddenError } from './errors'

export function resolveContractManageScope(actorId: string, role: UserRole): ContractManageScope {
  if (isAgencyManager(role)) return {}
  if (role === 'AGENT') return { responsibleId: actorId }
  if (role === 'RENTER') throw new ContractRenterForbiddenError()

  throw new ForbiddenError()
}

export function resolveContractReadScope(
  actorTenantId: string,
  actorId: string,
  role: UserRole,
): ContractReadScope {
  if (role === 'RENTER') return { kind: 'party', userId: actorId }
  if (isPropertyOwner(role)) {
    return { kind: 'propertyOwner', tenantId: actorTenantId, ownerId: actorId }
  }

  return { kind: 'tenant', tenantId: actorTenantId, ...resolveContractManageScope(actorId, role) }
}
