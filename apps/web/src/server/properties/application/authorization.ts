import { isAgencyManager, isAgencyStaff, isPropertyOwner } from '@server/auth/domain/roles'
import type { UserRole } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'

import { PropertyNotFoundError } from '../domain/errors'
import type { PropertyAccessTarget } from '../types/property'

export function assertCanEditProperties(actorRole: UserRole): void {
  if (!isAgencyStaff(actorRole) && !isPropertyOwner(actorRole)) {
    throw new ForbiddenError('Só a equipe da imobiliária e o proprietário gerenciam imóveis.')
  }
}

export function assertPropertyAccess(
  property: PropertyAccessTarget,
  actorId: string,
  actorRole: UserRole,
): void {
  if (isAgencyManager(actorRole)) return
  if (actorRole === 'AGENT' && property.responsibleId === actorId) return
  if (isPropertyOwner(actorRole) && property.ownerId === actorId) return

  throw new PropertyNotFoundError()
}
