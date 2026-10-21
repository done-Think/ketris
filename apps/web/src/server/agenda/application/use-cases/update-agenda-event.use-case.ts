import type { Papel } from '@server/auth/domain/user.entity'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { PropertyNotFoundError } from '@server/properties/domain/errors'
import type { PropertyRepository } from '@server/properties/application/ports/property-repository.port'

import { assertCanManageAgenda, assertCanManageAgendaEvent } from '../../domain/agenda-access-rules'
import { validateAgendaResponsible } from '../validate-agenda-responsible'
import { validateAgendaSchedule } from '../validate-agenda-schedule'
import { AGENDA_MINIMUM_VISIT_MINUTES } from '@shared/lib/utils/agenda-scheduling'
import { normalizeAgendaEventLinks } from '../../domain/agenda-event-links'
import { AgendaEventNotFoundError, AgendaVisitMinimumDurationError } from '../../domain/errors'
import type { AgendaEventChanges, AgendaEventLinks } from '../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export interface UpdateAgendaEventInput extends AgendaEventChanges, AgendaEventLinks {
  outsideBusinessHoursConfirmed?: boolean
  durationMinutes?: number
  actorTenantId: string
  actorPapel: Papel
  actorUserId?: string
  id: string
}

export class UpdateAgendaEventUseCase {
  constructor(
    private readonly agendaEventRepository: AgendaEventRepository,
    private readonly propertyRepository: PropertyRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: UpdateAgendaEventInput) {
    assertCanManageAgenda(input.actorPapel)
    const existing = await this.agendaEventRepository.findByTenantAndId(
      input.actorTenantId,
      input.id,
    )
    if (!existing) throw new AgendaEventNotFoundError()
    assertCanManageAgendaEvent(input.actorPapel, input.actorUserId, existing)
    if (
      input.actorPapel !== 'ADMIN' &&
      ((input.destino !== undefined && input.destino !== (existing.destino ?? 'LEGACY_TEAM')) ||
        (input.interno !== undefined && input.interno !== Boolean(existing.interno)) ||
        (input.responsavelId !== undefined && input.responsavelId !== existing.responsavelId))
    )
      throw new ForbiddenError()

    const destino = input.destino ?? existing.destino ?? 'LEGACY_TEAM'
    const interno = input.interno ?? existing.interno ?? false
    const responsavelId = input.responsavelId ?? existing.responsavelId
    if (
      input.responsavelId !== undefined ||
      (input.destino !== undefined && destino === 'ASSIGNED_AGENT')
    ) {
      await validateAgendaResponsible(
        this.userRepository,
        input.actorTenantId,
        responsavelId,
        destino === 'ASSIGNED_AGENT',
      )
    }
    if (
      interno &&
      (destino === 'LEGACY_TEAM' || input.donoEmail || input.participanteEmails?.length)
    ) {
      throw new ConflictError('Eventos internos são destinados apenas à equipe da imobiliária.')
    }
    if (
      !interno &&
      ((input.participanteNome ?? existing.participanteNome).trim().length < 2 ||
        !(input.participanteTelefone ?? existing.participanteTelefone).trim() ||
        (destino !== 'LEGACY_TEAM' &&
          !(input.imovelId !== undefined ? input.imovelId : existing.imovelId) &&
          !(input.referenciaImovelLivre !== undefined
            ? input.referenciaImovelLivre
            : existing.referenciaImovelLivre)))
    )
      throw new ConflictError('Informe imóvel, cliente e telefone para eventos com cliente.')

    if (input.imovelId) {
      const property = await this.propertyRepository.findByTenantAndId(
        input.actorTenantId,
        input.imovelId,
      )

      if (!property) {
        throw new PropertyNotFoundError()
      }
    }

    const schedule =
      input.inicio !== undefined ||
      input.durationMinutes !== undefined ||
      input.responsavelId !== undefined
        ? await validateAgendaSchedule(this.agendaEventRepository, existing, input)
        : undefined
    if (!schedule && input.tipo === 'VISIT') {
      const durationMinutes = (existing.fim.getTime() - existing.inicio.getTime()) / 60_000

      if (durationMinutes < AGENDA_MINIMUM_VISIT_MINUTES) {
        throw new AgendaVisitMinimumDurationError()
      }
    }

    const event = await this.agendaEventRepository.update(
      input.actorTenantId,
      input.id,
      {
        ...schedule,
        titulo: input.titulo,
        tipo: input.tipo,
        destino: input.destino,
        interno: input.interno,
        responsavelId: input.responsavelId,
        status: input.status,
        imovelId: input.imovelId,
        referenciaImovelLivre: input.referenciaImovelLivre,
        participanteNome: input.participanteNome,
        participanteTelefone: input.participanteTelefone,
        notas: input.notas,
      },
      normalizeAgendaEventLinks({
        donoEmail: interno ? null : input.donoEmail,
        participanteEmails: interno ? [] : input.participanteEmails,
      }),
    )

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return event
  }
}
