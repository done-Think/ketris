import type { Papel } from '@server/auth/domain/user.entity'
import { PropertyNotFoundError } from '@server/properties/domain/errors'
import type { PropertyRepository } from '@server/properties/application/ports/property-repository.port'

import { assertCanManageAgenda } from '../../domain/agenda-access-rules'
import { normalizeAgendaEventLinks } from '../../domain/agenda-event-links'
import { AgendaEventNotFoundError, AgendaVisitMinimumDurationError } from '../../domain/errors'
import type { AgendaEventChanges, AgendaEventLinks } from '../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export interface UpdateAgendaEventInput extends AgendaEventChanges, AgendaEventLinks {
  actorTenantId: string
  actorPapel: Papel
  id: string
}

export class UpdateAgendaEventUseCase {
  constructor(
    private readonly agendaEventRepository: AgendaEventRepository,
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(input: UpdateAgendaEventInput) {
    assertCanManageAgenda(input.actorPapel)

    if (input.imovelId) {
      const property = await this.propertyRepository.findByTenantAndId(
        input.actorTenantId,
        input.imovelId,
      )

      if (!property) {
        throw new PropertyNotFoundError()
      }
    }

    if (input.tipo === 'VISIT') {
      const existing = await this.agendaEventRepository.findByTenantAndId(
        input.actorTenantId,
        input.id,
      )

      if (!existing) {
        throw new AgendaEventNotFoundError()
      }

      const durationMinutes = (existing.fim.getTime() - existing.inicio.getTime()) / 60_000

      if (durationMinutes < 60) {
        throw new AgendaVisitMinimumDurationError()
      }
    }

    const event = await this.agendaEventRepository.update(
      input.actorTenantId,
      input.id,
      {
        titulo: input.titulo,
        tipo: input.tipo,
        status: input.status,
        imovelId: input.imovelId,
        referenciaImovelLivre: input.referenciaImovelLivre,
        participanteNome: input.participanteNome,
        participanteTelefone: input.participanteTelefone,
        notas: input.notas,
      },
      normalizeAgendaEventLinks({
        donoEmail: input.donoEmail,
        participanteEmails: input.participanteEmails,
      }),
    )

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return event
  }
}
