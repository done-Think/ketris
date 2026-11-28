import type { InstagramRepository } from '../ports/instagram-repository.port'
import type { InstagramActor } from '../../types/instagram'
import { assertInstagramActor, assertInstagramProperty } from '../../domain/access'
import { InstagramError } from '../../domain/errors'

export class RetryInstagramPublicationUseCase {
  constructor(private readonly repository: InstagramRepository) {}

  async execute(actor: InstagramActor, id: string) {
    assertInstagramActor(actor)
    const job = await this.repository.publication(id)
    if (!job || job.tenantId !== actor.tenantId || job.requestedBy !== actor.id)
      throw new InstagramError('INSTAGRAM_PUBLICATION_NOT_FOUND', 'Publicação não encontrada.', 404)
    const property = await this.repository.property(actor.tenantId, job.propertyId)
    assertInstagramProperty(actor, property)
    if (
      property.status !== 'PUBLISHED' ||
      !(await this.repository.retry(actor.tenantId, actor.id, id))
    )
      throw new InstagramError(
        'INSTAGRAM_RETRY_UNAVAILABLE',
        'A publicação não pode ser reenviada automaticamente.',
        409,
      )
  }
}
