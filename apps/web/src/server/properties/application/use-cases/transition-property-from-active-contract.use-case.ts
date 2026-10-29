import type { TransitionPropertyFromActiveContractInput } from '../../types/use-case-inputs'
import { ContractNotFoundError, ContractPropertyTransitionError } from '../../domain/errors'
import type { PropertyStatus } from '../../types/property'
import type { PropertyRepository } from '../ports/property-repository.port'

export class TransitionPropertyFromActiveContractUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(input: TransitionPropertyFromActiveContractInput) {
    const contractProperty = await this.propertyRepository.findContractProperty(
      input.actorTenantId,
      input.contractId,
    )

    if (!contractProperty) {
      throw new ContractNotFoundError()
    }

    if (contractProperty.contractStatus !== 'ACTIVE') {
      throw new ContractPropertyTransitionError()
    }

    const status: PropertyStatus = contractProperty.purpose === 'RENT' ? 'RENTED' : 'SOLD'
    const property = await this.propertyRepository.setStatus(
      input.actorTenantId,
      contractProperty.propertyId,
      status,
      null,
    )

    if (!property) {
      throw new ContractNotFoundError()
    }

    return property
  }
}
