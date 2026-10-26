import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import { assertAdmin } from '../../domain/maintenance-access-rules'
import type { LinkMaintenanceUsersInput } from '../../types/use-case-inputs'

export class LinkMaintenanceUsersUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}

  async execute({ contractId, ownerId, partyId, renterId, ...actor }: LinkMaintenanceUsersInput) {
    assertAdmin(actor)
    await this.repository.linkUsers(actor, { contractId, ownerId, partyId, renterId })
  }
}
