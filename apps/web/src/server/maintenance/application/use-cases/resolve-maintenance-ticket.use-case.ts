import {
  MaintenanceTicketAlreadyResolvedError,
  MaintenanceTicketNotFoundError,
} from '../../domain/errors'
import type { MaintenanceTicket } from '../../domain/maintenance-ticket.entity'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export interface ResolveMaintenanceTicketInput {
  actorTenantId: string
  actorId: string
  actorName: string
  ticketId: string
}

export class ResolveMaintenanceTicketUseCase {
  constructor(private readonly maintenanceTicketRepository: MaintenanceTicketRepository) {}

  async execute(input: ResolveMaintenanceTicketInput): Promise<MaintenanceTicket> {
    const existing = await this.maintenanceTicketRepository.findById(
      input.actorTenantId,
      input.ticketId,
    )

    if (!existing) {
      throw new MaintenanceTicketNotFoundError()
    }

    if (existing.status === 'RESOLVIDO' || existing.status === 'FECHADO') {
      throw new MaintenanceTicketAlreadyResolvedError()
    }

    return this.maintenanceTicketRepository.resolve(input.actorTenantId, input.ticketId, {
      type: 'MUDANCA_STATUS',
      message: 'Chamado marcado como resolvido.',
      authorId: input.actorId,
      authorName: input.actorName,
    })
  }
}
