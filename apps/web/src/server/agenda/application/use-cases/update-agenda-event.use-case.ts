import { isAgencyManager, isPropertyOwner } from '@server/auth/domain/roles'
import type { Papel } from '@server/auth/domain/user.entity'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { PropertyNotFoundError } from '@server/properties/domain/errors'
import type { PropertyRepository } from '@server/properties/application/ports/property-repository.port'

import { assertCanManageAgendaEvent } from '../../domain/agenda-access-rules'
import {
  findManageableAgendaEvent,
  manageableAgendaEventTenantId,
} from '../find-manageable-agenda-event'
import { validateAgendaResponsible } from '../validate-agenda-responsible'
import { validateAgendaSchedule } from '../validate-agenda-schedule'
import { AGENDA_MINIMUM_VISIT_MINUTES } from '@shared/lib/utils/agenda-scheduling'
import { normalizeAgendaEventLinks } from '../../domain/agenda-event-links'
import {
  AgendaEventNotFoundError,
  AgendaRenterLinksForbiddenError,
  AgendaRenterPropertyRequiredError,
  AgendaVisitMinimumDurationError,
} from '../../domain/errors'
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
    const existing = await findManageableAgendaEvent(this.agendaEventRepository, input, input.id)
    if (!existing) throw new AgendaEventNotFoundError()
    assertCanManageAgendaEvent(input.actorPapel, input.actorUserId, existing)
    if (
      !isAgencyManager(input.actorPapel) &&
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
        manageableAgendaEventTenantId(input, existing),
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

    if (input.actorPapel === 'RENTER') {
      if (input.donoEmail || input.participanteEmails?.length) {
        throw new AgendaRenterLinksForbiddenError()
      }
      if (input.referenciaImovelLivre) throw new AgendaRenterPropertyRequiredError()
    }

    if (input.imovelId) {
      const property =
        input.actorPapel === 'RENTER'
          ? await this.propertyRepository.findRenterContractProperty(
              input.actorUserId ?? '',
              input.imovelId,
            )
          : await this.propertyRepository.findByTenantAndId(
              manageableAgendaEventTenantId(input, existing),
              input.imovelId,
              undefined,
              isPropertyOwner(input.actorPapel) ? input.actorUserId : undefined,
            )

      if (!property || property.tenantId !== manageableAgendaEventTenantId(input, existing)) {
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
      manageableAgendaEventTenantId(input, existing),
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
