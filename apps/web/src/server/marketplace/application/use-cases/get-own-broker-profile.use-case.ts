import type { Papel } from '@server/auth/domain/user.entity'

import { assertBrokerProfileAccess } from '../authorization'
import type { BrokerProfile } from '../../types/broker-profile'
import type { BrokerProfileRepository } from '../ports/broker-profile-repository.port'

export interface GetOwnBrokerProfileInput {
  actorId: string
  actorPapel: Papel
}

export class GetOwnBrokerProfileUseCase {
  constructor(private readonly brokerProfileRepository: BrokerProfileRepository) {}

  async execute(input: GetOwnBrokerProfileInput): Promise<BrokerProfile | null> {
    assertBrokerProfileAccess(input.actorPapel)

    return this.brokerProfileRepository.findByUsuarioId(input.actorId)
  }
}
