import { isPropertyOwner } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import type { ChargeReadActor } from '../types/charge-read'
import type { ChargeReadScope } from '../types/charge-read-scope'
import { assertCanAccessFinance } from './assert-can-access-finance'

export function resolveChargeReadScope(actor: ChargeReadActor): ChargeReadScope {
  if (actor.actorPapel === 'RENTER' && actor.actorId) {
    return { kind: 'renter', userId: actor.actorId }
  }

  if (isPropertyOwner(actor.actorPapel) && actor.actorId && actor.actorTenantId) {
    return { kind: 'propertyOwner', tenantId: actor.actorTenantId, ownerId: actor.actorId }
  }

  assertCanAccessFinance(actor.actorPapel)

  if (actor.actorTenantId) {
    return { kind: 'tenant', tenantId: actor.actorTenantId }
  }

  throw new ForbiddenError()
}
