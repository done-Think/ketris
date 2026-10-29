import { assertBrokerProfileAccess } from '../authorization'
import { BrokerProfileNotFoundError } from '../../domain/errors'
import type { BrokerProfile } from '../../types/broker-profile'
import type { BrokerProfileRepository } from '../ports/broker-profile-repository.port'
import type { UnpublishBrokerProfileInput } from '../../types/use-case-inputs'

export class UnpublishBrokerProfileUseCase {
  constructor(private readonly brokerProfileRepository: BrokerProfileRepository) {}

  async execute(input: UnpublishBrokerProfileInput): Promise<BrokerProfile> {
    assertBrokerProfileAccess(input.actorRole)

    const unpublished = await this.brokerProfileRepository.setStatus(input.actorId, 'DRAFT', null)

    if (!unpublished) {
      throw new BrokerProfileNotFoundError()
    }

    return unpublished
  }
}
