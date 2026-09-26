import type { Papel } from '@server/auth/domain/user.entity'

import { assertBrokerProfileAccess } from '../authorization'
import { BrokerProfileNotFoundError } from '../../domain/errors'
import type { BrokerProfile } from '../../domain/broker-profile.entity'
import type { BrokerProfileRepository } from '../ports/broker-profile-repository.port'

export interface UnpublishBrokerProfileInput {
  actorId: string
  actorPapel: Papel
}

export class UnpublishBrokerProfileUseCase {
  constructor(private readonly brokerProfileRepository: BrokerProfileRepository) {}

  async execute(input: UnpublishBrokerProfileInput): Promise<BrokerProfile> {
    assertBrokerProfileAccess(input.actorPapel)

    const unpublished = await this.brokerProfileRepository.setStatus(input.actorId, 'DRAFT', null)

    if (!unpublished) {
      throw new BrokerProfileNotFoundError()
    }

    return unpublished
  }
}
