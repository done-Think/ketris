import { ForbiddenError } from '@server/shared/errors'
import { isAgencyStaff, isAgencyManager, isPropertyOwner } from '@server/auth/domain/roles'
import type { InstagramActor, InstagramProperty } from '../types/instagram'
import { InstagramError } from './errors'

export function assertInstagramActor(actor: InstagramActor) {
  if ((!isAgencyStaff(actor.role) && !isPropertyOwner(actor.role)) || !actor.tenantId || !actor.id)
    throw new ForbiddenError()
}

export function canPublishInstagramProperty(actor: InstagramActor, property: InstagramProperty) {
  return (
    property.tenantId === actor.tenantId &&
    (isAgencyManager(actor.role) ||
      (actor.role === 'AGENT' && property.responsibleId === actor.id) ||
      (isPropertyOwner(actor.role) && property.ownerId === actor.id))
  )
}

export function assertInstagramProperty(
  actor: InstagramActor,
  property: InstagramProperty | null,
): asserts property is InstagramProperty {
  assertInstagramActor(actor)
  if (!property || !canPublishInstagramProperty(actor, property))
    throw new InstagramError('INSTAGRAM_PROPERTY_NOT_FOUND', 'Imóvel não encontrado.', 404)
}
