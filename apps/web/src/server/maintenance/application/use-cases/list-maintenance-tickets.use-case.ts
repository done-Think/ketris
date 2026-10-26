import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import type { ListMaintenanceTicketsInput } from '../../types/use-case-inputs'

export class ListMaintenanceTicketsUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}

  async execute(filters: ListMaintenanceTicketsInput) {
    if (
      filters.tenantId !== filters.actor.actorTenantId ||
      (filters.archived && !isAgencyManager(filters.actor.actorPapel))
    )
      throw new ForbiddenError()

    return this.repository.findMany(filters)
  }
}
