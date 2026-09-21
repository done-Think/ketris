import type { Papel } from '@server/auth/domain/user.entity'

import { PropertyNotFoundError } from '../domain/errors'

/**
 * ADMIN/OWNER manage every property in their tenant. An AGENT only manages the properties
 * they're `responsavelId` for. Everyone else (including a different AGENT) gets the same
 * opaque not-found used for cross-tenant access, so they can't tell "doesn't exist" from
 * "isn't yours". Mirrors `assertAgentOwnsProperty` in `@server/crm/application/authorization`.
 */
export function assertPropertyAccess(
  responsavelId: string,
  actorId: string,
  actorPapel: Papel,
): void {
  if (actorPapel === 'ADMIN' || actorPapel === 'OWNER') return
  if (actorPapel === 'AGENT' && responsavelId === actorId) return

  throw new PropertyNotFoundError()
}
