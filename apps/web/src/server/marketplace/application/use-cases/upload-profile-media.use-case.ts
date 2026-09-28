import type { Papel } from '@server/auth/domain/user.entity'

import { ProfileMediaValidationError } from '../../domain/errors'
import { assertAgencyProfileAccess, assertBrokerProfileAccess } from '../authorization'
import type { ProfileMediaStoragePort } from '../ports/profile-media-storage.port'

export type ProfileMediaTarget = 'broker-avatar' | 'broker-banner' | 'agency-logo' | 'agency-banner'

const allowedContentTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxFileSizeBytes = 8 * 1024 * 1024

export interface UploadProfileMediaUseCaseInput {
  actorId: string
  actorTenantId: string
  actorPapel: Papel
  target: ProfileMediaTarget
  filename: string
  contentType: string
  body: Buffer
}

function buildKeyPrefix(input: UploadProfileMediaUseCaseInput): string {
  switch (input.target) {
    case 'broker-avatar':
      return `profiles/brokers/${input.actorId}/avatar-`
    case 'broker-banner':
      return `profiles/brokers/${input.actorId}/banner-`
    case 'agency-logo':
      return `profiles/agencies/${input.actorTenantId}/logo-`
    case 'agency-banner':
      return `profiles/agencies/${input.actorTenantId}/banner-`
  }
}

export class UploadProfileMediaUseCase {
  constructor(private readonly mediaStorage: ProfileMediaStoragePort) {}

  async execute(input: UploadProfileMediaUseCaseInput) {
    if (input.target === 'broker-avatar' || input.target === 'broker-banner') {
      assertBrokerProfileAccess(input.actorPapel)
    } else {
      assertAgencyProfileAccess(input.actorPapel)
    }

    if (input.body.byteLength === 0) {
      throw new ProfileMediaValidationError('Arquivo vazio.')
    }

    if (input.body.byteLength > maxFileSizeBytes) {
      throw new ProfileMediaValidationError('Imagem muito grande. O limite é 8MB.')
    }

    if (!allowedContentTypes.has(input.contentType)) {
      throw new ProfileMediaValidationError(
        'Formato de imagem não suportado. Use JPEG, PNG ou WebP.',
      )
    }

    return this.mediaStorage.upload({
      keyPrefix: buildKeyPrefix(input),
      filename: input.filename,
      contentType: input.contentType,
      body: input.body,
    })
  }
}
