import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'
import type { ListMaintenanceProvidersInput } from '../../types/maintenance-provider'
import { maintenanceProviderTenant } from '../maintenance-provider-scope'
import type { MaintenanceProviderRepository } from '../ports/maintenance-provider-repository.port'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export class ListMaintenanceProvidersUseCase {
  constructor(
    private readonly repository: MaintenanceProviderRepository,
    private readonly tickets: MaintenanceTicketRepository,
  ) {}
  async execute(input: ListMaintenanceProvidersInput) {
    if (input.includeInactive && !isAgencyManager(input.actorPapel)) throw new ForbiddenError()
    const tenantId = await maintenanceProviderTenant(this.tickets, input, input.ticketId)
    return this.repository.list(tenantId, input)
  }
}
