import {
  MAINTENANCE_ATTACHMENT_MAX_BYTES,
  MAINTENANCE_ATTACHMENT_TYPES,
} from '../config/attachment-limits'
import { MaintenanceAttachmentValidationError } from './errors'

export function validateMaintenanceAttachmentMetadata(input: {
  filename: string
  contentType: string
  size: number
  sha256: string
}) {
  if (
    !input.filename.trim() ||
    input.filename.trim().length > 255 ||
    !Number.isInteger(input.size) ||
    input.size <= 0 ||
    input.size > MAINTENANCE_ATTACHMENT_MAX_BYTES ||
    !MAINTENANCE_ATTACHMENT_TYPES.some((type) => type === input.contentType) ||
    !/^[a-f0-9]{64}$/.test(input.sha256)
  )
    throw new MaintenanceAttachmentValidationError(
      'Imagem inválida. Envie JPEG, PNG ou WebP de até 8 MB.',
    )
  return {
    filename: input.filename.trim(),
    contentType: input.contentType,
    size: input.size,
    sha256: input.sha256,
  }
}
