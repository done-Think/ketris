import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

import { PropertyMediaValidationError } from '../../domain/errors'
import type { PropertyMediaStoragePort } from '../ports/property-media-storage.port'

const allowedContentTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxFileSizeBytes = 8 * 1024 * 1024

export interface UploadPropertyMediaUseCaseInput {
  actorTenantId: string
  actorPapel: Papel
  filename: string
  contentType: string
  body: Buffer
}

export class UploadPropertyMediaUseCase {
  constructor(private readonly mediaStorage: PropertyMediaStoragePort) {}

  async execute(input: UploadPropertyMediaUseCaseInput) {
    if (input.actorPapel === 'RENTER') {
      throw new ForbiddenError('Locatários não podem gerenciar imóveis.')
    }

    if (input.body.byteLength === 0) {
      throw new PropertyMediaValidationError('Arquivo vazio.')
    }

    if (input.body.byteLength > maxFileSizeBytes) {
      throw new PropertyMediaValidationError('Imagem muito grande. O limite é 8MB.')
    }

    if (!allowedContentTypes.has(input.contentType)) {
      throw new PropertyMediaValidationError(
        'Formato de imagem não suportado. Use JPEG, PNG ou WebP.',
      )
    }

    return this.mediaStorage.upload({
      tenantId: input.actorTenantId,
      filename: input.filename,
      contentType: input.contentType,
      body: input.body,
    })
  }
}
