import { isAgencyManager, isAgencyStaff, isPropertyOwner } from '@server/auth/domain/roles'
import type { Papel } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'

import { PropertyNotFoundError } from '../domain/errors'
import type { PropertyAccessTarget } from '../types/property'

export function assertCanEditProperties(actorPapel: Papel): void {
  if (!isAgencyStaff(actorPapel) && !isPropertyOwner(actorPapel)) {
    throw new ForbiddenError('Só a equipe da imobiliária e o proprietário gerenciam imóveis.')
  }
}

export function assertPropertyAccess(
  property: PropertyAccessTarget,
  actorId: string,
  actorPapel: Papel,
): void {
  if (isAgencyManager(actorPapel)) return
  if (actorPapel === 'AGENT' && property.responsavelId === actorId) return
  if (isPropertyOwner(actorPapel) && property.proprietarioId === actorId) return

  throw new PropertyNotFoundError()
}
