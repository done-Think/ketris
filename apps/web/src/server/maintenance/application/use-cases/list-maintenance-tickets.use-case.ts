import { ForbiddenError } from '@server/shared/errors'
import type { MaintenanceTicketListFilters } from '../../types/maintenance-ticket'
import type { MaintenanceTicketRepository } from '../../types/maintenance-ticket-repository'

export class ListMaintenanceTicketsUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}
  async execute(filters: MaintenanceTicketListFilters) {
    if (
      filters.tenantId !== filters.actor.actorTenantId ||
      (filters.archived && filters.actor.actorPapel !== 'ADMIN')
    )
      throw new ForbiddenError()
    return this.repository.findMany(filters)
  }
}
