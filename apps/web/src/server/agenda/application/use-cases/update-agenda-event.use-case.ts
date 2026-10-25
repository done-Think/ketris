import {
  prepareAgendaPropertySummary,
  withPreparedAgendaPropertySummary,
} from '../with-agenda-property-summaries'
import type { AgendaPropertyCatalog } from '../ports/agenda-property-catalog.port'
import type { UpdateAgendaEventInput } from '../../types/use-case-inputs'
import { isAgencyManager, isPropertyOwner } from '@server/auth/domain/roles'

import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { AgendaPropertyNotFoundError } from '../../domain/errors'
import type { AgendaPropertyLookup } from '../ports/agenda-property-lookup.port'

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
  AgendaCancellationReasonRequiredError,
  AgendaRenterLinksForbiddenError,
  AgendaRenterPropertyRequiredError,
  AgendaVisitMinimumDurationError,
} from '../../domain/errors'

import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export class UpdateAgendaEventUseCase {
  constructor(
    private readonly agendaEventRepository: AgendaEventRepository,
    private readonly propertyRepository: AgendaPropertyLookup,
    private readonly userRepository: UserRepository,
    private readonly propertyCatalog?: AgendaPropertyCatalog,
  ) {}

  async execute(input: UpdateAgendaEventInput) {
    const existing = await findManageableAgendaEvent(this.agendaEventRepository, input, input.id)
    if (!existing) throw new AgendaEventNotFoundError()
    assertCanManageAgendaEvent(input.actorPapel, input.actorUserId, existing)
    if (
      !isAgencyManager(input.actorPapel) &&
      ((input.destino !== undefined && input.destino !== (existing.destino ?? 'SHARED_TEAM')) ||
        (input.interno !== undefined && input.interno !== Boolean(existing.interno)) ||
        (input.responsavelId !== undefined && input.responsavelId !== existing.responsavelId))
    )
      throw new ForbiddenError()

    const destino = input.destino ?? existing.destino ?? 'SHARED_TEAM'
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
      (destino === 'SHARED_TEAM' || input.donoEmail || input.participanteEmails?.length)
    ) {
      throw new ConflictError('Eventos internos são destinados apenas à equipe da imobiliária.')
    }
    if (
      !interno &&
      ((input.participanteNome ?? existing.participanteNome).trim().length < 2 ||
        !(input.participanteTelefone ?? existing.participanteTelefone).trim() ||
        (destino !== 'SHARED_TEAM' &&
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
          ? await this.propertyRepository.findRentedProperty(
              input.actorUserId ?? '',
              input.imovelId,
            )
          : await this.propertyRepository.findAccessibleProperty(
              manageableAgendaEventTenantId(input, existing),
              input.imovelId,
              isPropertyOwner(input.actorPapel) ? input.actorUserId : undefined,
            )

      if (!property || property.tenantId !== manageableAgendaEventTenantId(input, existing)) {
        throw new AgendaPropertyNotFoundError()
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

    if (input.status === 'CANCELLED' && !input.motivoCancelamento?.trim())
      throw new AgendaCancellationReasonRequiredError()

    const propertySummary = await prepareAgendaPropertySummary(
      this.propertyCatalog,
      input,
      input.imovelId === undefined ? existing.imovelId : input.imovelId,
    )

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
        motivoCancelamento: input.motivoCancelamento,
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
      input.actorUserId,
    )

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return withPreparedAgendaPropertySummary(event, propertySummary)
  }
}
