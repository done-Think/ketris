import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

import { AgendaEventNotFoundError } from '../../domain/errors'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export interface CancelAgendaEventInput {
  actorTenantId: string
  actorPapel: Papel
  id: string
}

export class CancelAgendaEventUseCase {
  constructor(private readonly agendaEventRepository: AgendaEventRepository) {}

  async execute(input: CancelAgendaEventInput) {
    if (input.actorPapel === 'RENTER') {
      throw new ForbiddenError('Locatários não podem gerenciar a agenda.')
    }

    const event = await this.agendaEventRepository.cancel(input.actorTenantId, input.id)

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return event
  }
}
