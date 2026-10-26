import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'
import type { MaintenanceTicketListFilters } from '../../types/maintenance-ticket'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export class ListMaintenanceTicketsUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}
  async execute(filters: MaintenanceTicketListFilters) {
    if (
      filters.tenantId !== filters.actor.actorTenantId ||
      (filters.archived && !isAgencyManager(filters.actor.actorPapel))
    )
      throw new ForbiddenError()
    return this.repository.findMany(filters)
  }
}
