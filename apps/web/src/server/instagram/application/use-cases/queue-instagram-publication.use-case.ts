import { assertInstagramActor, assertInstagramProperty } from '../../domain/access'
import { InstagramError } from '../../domain/errors'
import type { InstagramActor } from '../../types/instagram'
import type { InstagramRepository } from '../ports/instagram-repository.port'
import type { InstagramTokenVault } from '../ports/instagram-api.port'

export class QueueInstagramPublicationUseCase {
  constructor(
    private readonly repository: InstagramRepository,
    private readonly vault: InstagramTokenVault,
  ) {}

  async execute(actor: InstagramActor, propertyId: string, caption: string, imageUrls: string[]) {
    assertInstagramActor(actor)
    if (
      caption.length > 2200 ||
      !imageUrls.length ||
      imageUrls.length > 20 ||
      new Set(imageUrls).size !== imageUrls.length
    ) {
      throw new InstagramError(
        'INSTAGRAM_INVALID_POST',
        'Selecione de 1 a 20 fotos distintas e uma legenda de até 2.200 caracteres.',
      )
    }
    const property = await this.repository.property(actor.tenantId, propertyId)
    assertInstagramProperty(actor, property)
    if (property.status !== 'PUBLISHED')
      throw new InstagramError(
        'INSTAGRAM_PROPERTY_NOT_PUBLISHED',
        'Publique o imóvel no site antes de enviar ao Instagram.',
        409,
      )
    if (imageUrls.some((url) => !property.mediaUrls.includes(url)))
      throw new InstagramError('INSTAGRAM_INVALID_MEDIA', 'Use somente fotos deste imóvel.')
    const connection = await this.repository.connection(actor.tenantId, actor.id)
    if (!connection || connection.expiresAt.getTime() <= Date.now())
      throw new InstagramError(
        'INSTAGRAM_RECONNECT_REQUIRED',
        'Conecte novamente a conta do Instagram.',
        409,
      )
    const dedupeKey = this.vault.digest(
      JSON.stringify([actor.tenantId, propertyId, connection.accountId]),
    )
    return this.repository.enqueue({
      tenantId: actor.tenantId,
      propertyId,
      accountId: connection.accountId,
      oauthUserId: connection.oauthUserId,
      connectionRevision: connection.revision,
      requestedBy: actor.id,
      dedupeKey,
      caption: caption.trim(),
      imageUrls,
    })
  }
}
