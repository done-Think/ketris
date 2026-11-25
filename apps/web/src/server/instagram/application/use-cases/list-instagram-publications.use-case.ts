import type { InstagramRepository } from '../ports/instagram-repository.port'
import type { InstagramActor } from '../../types/instagram'
import { assertInstagramActor, assertInstagramProperty } from '../../domain/access'

export class ListInstagramPublicationsUseCase {
  constructor(private readonly repository: InstagramRepository) {}

  async execute(actor: InstagramActor, propertyId: string) {
    assertInstagramActor(actor)
    const property = await this.repository.property(actor.tenantId, propertyId)
    assertInstagramProperty(actor, property)
    return this.repository.publications(actor.tenantId, propertyId, actor.id)
  }
}
