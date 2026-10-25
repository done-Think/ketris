import {
  prepareAgendaPropertySummary,
  withPreparedAgendaPropertySummary,
} from '../with-agenda-property-summaries'
import type { AgendaPropertyCatalog } from '../ports/agenda-property-catalog.port'
import type { CreateAgendaEventInput } from '../../types/use-case-inputs'
import { isPropertyOwner } from '@server/auth/domain/roles'

import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import { AgendaPropertyNotFoundError } from '../../domain/errors'
import type { AgendaPropertyLookup } from '../ports/agenda-property-lookup.port'

import { assertCanChooseAgendaAudience } from '../../domain/agenda-access-rules'
import { normalizeAgendaEventLinks } from '../../domain/agenda-event-links'
import { assertWithinAgendaSchedulingWindow } from '../../domain/agenda-scheduling-rules'
import {
  AgendaEventConflictError,
  AgendaRenterLinksForbiddenError,
  AgendaRenterPropertyRequiredError,
  AgendaResponsibleNotFoundError,
} from '../../domain/errors'

import { ConflictError } from '@server/shared/errors'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'
import { validateAgendaResponsible } from '../validate-agenda-responsible'
import { AGENDA_MINIMUM_VISIT_MINUTES } from '@shared/lib/utils/agenda-scheduling'
import { AgendaVisitMinimumDurationError } from '../../domain/errors'

export class CreateAgendaEventUseCase {
  constructor(
    private readonly agendaEventRepository: AgendaEventRepository,
    private readonly userRepository: UserRepository,
    private readonly propertyRepository: AgendaPropertyLookup,
    private readonly propertyCatalog?: AgendaPropertyCatalog,
  ) {}

  async execute(input: CreateAgendaEventInput) {
    assertCanChooseAgendaAudience(
      input.actorPapel,
      input.actorUserId,
      input.destino,
      input.interno,
      input.responsavelId,
    )
    if (
      input.interno &&
      (input.donoEmail ||
        input.participanteEmails?.length ||
        !input.destino ||
        input.destino === 'SHARED_TEAM')
    ) {
      throw new ConflictError('Eventos internos são destinados apenas à equipe da imobiliária.')
    }

    if (input.tipo === 'VISIT' && input.durationMinutes < AGENDA_MINIMUM_VISIT_MINUTES)
      throw new AgendaVisitMinimumDurationError()
    assertWithinAgendaSchedulingWindow(input.inicio, new Date(), input)

    const responsavelId = input.responsavelId ?? input.actorUserId

    if (responsavelId !== input.actorUserId) {
      await validateAgendaResponsible(
        this.userRepository,
        input.actorTenantId,
        responsavelId,
        input.destino === 'ASSIGNED_AGENT',
      )
    } else if (input.destino === 'ASSIGNED_AGENT' && input.actorPapel !== 'AGENT') {
      throw new AgendaResponsibleNotFoundError()
    }

    const tenantId = await this.resolveEventTenant(input)

    const inicio = input.inicio
    const fim = new Date(inicio.getTime() + input.durationMinutes * 60_000)

    const conflict = await this.agendaEventRepository.hasOverlap(
      tenantId,
      responsavelId,
      inicio,
      fim,
    )

    if (conflict) {
      throw new AgendaEventConflictError()
    }

    const links = normalizeAgendaEventLinks({
      donoEmail: input.donoEmail,
      participanteEmails: input.participanteEmails,
    })

    const propertySummary = await prepareAgendaPropertySummary(
      this.propertyCatalog,
      input,
      input.imovelId,
    )

    const event = await this.agendaEventRepository.create(
      {
        tenantId,
        responsavelId,
        criadoPorId: input.actorUserId,
        imovelId: input.imovelId ?? null,
        referenciaImovelLivre: input.referenciaImovelLivre ?? null,
        titulo: input.titulo,
        tipo: input.tipo ?? null,
        destino: input.destino,
        interno: input.interno,
        inicio,
        fim,
        participanteNome: input.participanteNome,
        participanteTelefone: input.participanteTelefone,
        notas: input.notas ?? null,
      },
      links,
    )
    return withPreparedAgendaPropertySummary(event, propertySummary)
  }

  private async resolveEventTenant(input: CreateAgendaEventInput): Promise<string> {
    if (input.actorPapel === 'RENTER') {
      if (input.donoEmail || input.participanteEmails?.length) {
        throw new AgendaRenterLinksForbiddenError()
      }
      if (!input.imovelId) throw new AgendaRenterPropertyRequiredError()

      const rented = await this.propertyRepository.findRentedProperty(
        input.actorUserId,
        input.imovelId,
      )

      if (!rented) throw new AgendaPropertyNotFoundError()

      return rented.tenantId
    }

    if (input.imovelId) {
      const property = await this.propertyRepository.findAccessibleProperty(
        input.actorTenantId,
        input.imovelId,
        isPropertyOwner(input.actorPapel) ? input.actorUserId : undefined,
      )

      if (!property) throw new AgendaPropertyNotFoundError()
    }

    return input.actorTenantId
  }
}
