import { provider as normalizeProvider } from '../../domain/maintenance-activity'
import type { CreateMaintenanceProviderInput } from '../../types/maintenance-provider'
import { maintenanceProviderTenant } from '../maintenance-provider-scope'
import type { MaintenanceProviderRepository } from '../ports/maintenance-provider-repository.port'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export class CreateMaintenanceProviderUseCase {
  constructor(
    private readonly repository: MaintenanceProviderRepository,
    private readonly tickets: MaintenanceTicketRepository,
  ) {}
  async execute(input: CreateMaintenanceProviderInput) {
    const tenantId = await maintenanceProviderTenant(this.tickets, input, input.ticketId)
    return this.repository.create(input, tenantId, normalizeProvider(input.provider))
  }
}
