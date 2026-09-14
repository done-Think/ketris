import { ContractNotFoundError, ContractPropertyTransitionError } from '../../domain/errors'
import type { PropertyStatus } from '../../domain/property.entity'
import type { PropertyRepository } from '../ports/property-repository.port'

export class TransitionPropertyFromActiveContractUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(input: { actorTenantId: string; contractId: string }) {
    const contractProperty = await this.propertyRepository.findContractProperty(
      input.actorTenantId,
      input.contractId,
    )

    if (!contractProperty) {
      throw new ContractNotFoundError()
    }

    if (contractProperty.contractStatus !== 'ATIVO') {
      throw new ContractPropertyTransitionError()
    }

    const status: PropertyStatus = contractProperty.finalidade === 'ALUGUEL' ? 'RENTED' : 'SOLD'
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
