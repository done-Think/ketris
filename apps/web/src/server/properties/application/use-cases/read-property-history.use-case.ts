import { ForbiddenError } from '@server/shared/errors'
import { PropertyNotFoundError } from '../../domain/errors'
import type { ReadPropertyHistoryInput } from '../../types/property-history'
import type { PropertyHistoryRepository } from '../ports/property-history-repository.port'
import type { GetPropertyUseCase } from './get-property.use-case'

export class ReadPropertyHistoryUseCase {
  constructor(
    private readonly properties: GetPropertyUseCase,
    private readonly history: PropertyHistoryRepository,
  ) {}
  async execute(input: ReadPropertyHistoryInput) {
    if (input.actorRole === 'RENTER') throw new ForbiddenError()
    const property = await this.properties.execute(input)
    if (input.eventId) {
      const event = await this.history.find(property.tenantId, property.id, input.eventId)
      if (!event) throw new PropertyNotFoundError()
      return { event }
    }
    return this.history.list(property.tenantId, property.id, input.page ?? 1, input.pageSize ?? 20)
  }
}
