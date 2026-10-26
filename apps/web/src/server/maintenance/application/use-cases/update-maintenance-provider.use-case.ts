import { assertAdmin } from '../../domain/maintenance-policy'
import type { UpdateMaintenanceProviderInput } from '../../types/maintenance-provider'
import type { MaintenanceProviderRepository } from '../ports/maintenance-provider-repository.port'

export class UpdateMaintenanceProviderUseCase {
  constructor(private readonly repository: MaintenanceProviderRepository) {}
  execute(input: UpdateMaintenanceProviderInput) {
    assertAdmin(input)
    return this.repository.update(input, input.providerId, input.changes)
  }
}
