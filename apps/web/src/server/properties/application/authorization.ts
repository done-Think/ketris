import { isAgencyManager, isAgencyStaff, isPropertyOwner } from '@server/auth/domain/roles'
import type { UserRole } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'

import { PropertyNotFoundError, PropertyPublicationForbiddenError } from '../domain/errors'
import type { Property, PropertyAccessTarget } from '../types/property'

export function assertCanRemovePropertyPublication(property: Property, actorRole: UserRole): void {
  if (actorRole === 'AGENT' && property.agencyManaged) throw new PropertyPublicationForbiddenError()
}

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
  if (
    actorRole === 'AGENT' &&
    (property.responsibleId === actorId || property.brokerIds?.includes(actorId))
  )
    return
  if (isPropertyOwner(actorRole) && property.ownerId === actorId) return

  throw new PropertyNotFoundError()
}
