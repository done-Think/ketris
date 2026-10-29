import { assertAdmin } from '../../domain/maintenance-policy'
import type { RegularizeMaintenanceLinksInput } from '../../types/use-case-inputs'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export class RegularizeMaintenanceLinksUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}

  execute(input: RegularizeMaintenanceLinksInput) {
    assertAdmin(input)
    return this.repository.linkUsers(input, input.links)
  }
}
