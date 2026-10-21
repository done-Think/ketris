import { ForbiddenError } from '@server/shared/errors'

import type { ChargeReadActor } from '../types/charge-read'
import type { ChargeReadScope } from '../types/charge-read-scope'

export function resolveChargeReadScope(actor: ChargeReadActor): ChargeReadScope {
  if (actor.actorPapel === 'RENTER' && actor.actorId) {
    return { kind: 'renter', userId: actor.actorId }
  }

  if (['ADMIN', 'OWNER', 'AGENT'].includes(actor.actorPapel) && actor.actorTenantId) {
    return { kind: 'tenant', tenantId: actor.actorTenantId }
  }

  throw new ForbiddenError()
}
