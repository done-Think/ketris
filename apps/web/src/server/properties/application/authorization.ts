import type { Papel } from '@server/auth/domain/user.entity'

import { PropertyNotFoundError } from '../domain/errors'

export function assertPropertyAccess(
  responsavelId: string,
  actorId: string,
  actorPapel: Papel,
): void {
  if (actorPapel === 'ADMIN' || actorPapel === 'OWNER') return
  if (actorPapel === 'AGENT' && responsavelId === actorId) return

  throw new PropertyNotFoundError()
}
