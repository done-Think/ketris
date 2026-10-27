import { assertBrokerProfileAccess } from '../authorization'
import type { BrokerProfile } from '../../types/broker-profile'
import type { BrokerProfileRepository } from '../ports/broker-profile-repository.port'
import type { GetOwnBrokerProfileInput } from '../../types/use-case-inputs'

export class GetOwnBrokerProfileUseCase {
  constructor(private readonly brokerProfileRepository: BrokerProfileRepository) {}

  async execute(input: GetOwnBrokerProfileInput): Promise<BrokerProfile | null> {
    assertBrokerProfileAccess(input.actorPapel)

    return this.brokerProfileRepository.findByUsuarioId(input.actorId)
  }
}
