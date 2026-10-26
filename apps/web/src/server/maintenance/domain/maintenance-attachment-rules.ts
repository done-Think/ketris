import { MaintenanceAttachmentValidationError, MaintenanceTicketNotFoundError } from './errors'
import type { MaintenanceActor } from '../types/maintenance-ticket'
import type { MaintenanceMediaObject } from '../types/maintenance-attachment'

export const MAINTENANCE_ATTACHMENT_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAINTENANCE_ATTACHMENT_MAX_BYTES = 8 * 1024 * 1024
export const MAINTENANCE_MEDIA_URL_PREFIX = '/api/maintenance/media/'

export function assertValidMaintenanceAttachment(sizeInBytes: number, contentType: string): void {
  if (sizeInBytes === 0) {
    throw new MaintenanceAttachmentValidationError('Arquivo vazio.')
  }
  if (sizeInBytes > MAINTENANCE_ATTACHMENT_MAX_BYTES) {
    throw new MaintenanceAttachmentValidationError('Imagem muito grande. O limite é 8MB.')
  }
  if (!MAINTENANCE_ATTACHMENT_CONTENT_TYPES.includes(contentType)) {
    throw new MaintenanceAttachmentValidationError(
      'Formato de imagem não suportado. Use JPEG, PNG ou WebP.',
    )
  }
}

// Attachment keys are `maintenance/<tenantId>/<file>`. Anything else (another prefix, path
// traversal, another tenant for agency users) is answered as "not found", never as a hint.
export function resolveMaintenanceMediaObject(
  actor: MaintenanceActor,
  keyParts: string[],
): MaintenanceMediaObject {
  const [prefix, tenantId] = keyParts

  if (
    prefix !== 'maintenance' ||
    !tenantId ||
    keyParts.length < 3 ||
    keyParts.some((part) => part === '..' || part === '.' || part === '') ||
    (actor.actorPapel !== 'RENTER' && tenantId !== actor.actorTenantId)
  ) {
    throw new MaintenanceTicketNotFoundError()
  }

  const objectKey = keyParts.join('/')

  return { objectKey, tenantId, url: `${MAINTENANCE_MEDIA_URL_PREFIX}${objectKey}` }
}
