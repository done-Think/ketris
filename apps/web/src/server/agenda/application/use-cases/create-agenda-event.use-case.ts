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
      input.actorRole,
      input.actorUserId,
      input.audience,
      input.internal,
      input.responsibleId,
    )
    if (
      input.internal &&
      (input.ownerEmail ||
        input.participantEmails?.length ||
        !input.audience ||
        input.audience === 'SHARED_TEAM')
    ) {
      throw new ConflictError('Eventos internos são destinados apenas à equipe da imobiliária.')
    }

    if (input.type === 'VISIT' && input.durationMinutes < AGENDA_MINIMUM_VISIT_MINUTES)
      throw new AgendaVisitMinimumDurationError()
    assertWithinAgendaSchedulingWindow(input.start, new Date(), input)

    const responsibleId = input.responsibleId ?? input.actorUserId

    if (responsibleId !== input.actorUserId) {
      await validateAgendaResponsible(
        this.userRepository,
        input.actorTenantId,
        responsibleId,
        input.audience === 'ASSIGNED_AGENT',
      )
    } else if (input.audience === 'ASSIGNED_AGENT' && input.actorRole !== 'AGENT') {
      throw new AgendaResponsibleNotFoundError()
    }

    const tenantId = await this.resolveEventTenant(input)

    const start = input.start
    const end = new Date(start.getTime() + input.durationMinutes * 60_000)

    const conflict = await this.agendaEventRepository.hasOverlap(
      tenantId,
      responsibleId,
      start,
      end,
    )

    if (conflict) {
      throw new AgendaEventConflictError()
    }

    const links = normalizeAgendaEventLinks({
      ownerEmail: input.ownerEmail,
      participantEmails: input.participantEmails,
    })

    const propertySummary = await prepareAgendaPropertySummary(
      this.propertyCatalog,
      input,
      input.propertyId,
    )

    const event = await this.agendaEventRepository.create(
      {
        tenantId,
        responsibleId,
        createdById: input.actorUserId,
        propertyId: input.propertyId ?? null,
        freeFormPropertyReference: input.freeFormPropertyReference ?? null,
        title: input.title,
        type: input.type ?? null,
        audience: input.audience,
        internal: input.internal,
        start,
        end,
        participantName: input.participantName,
        participantPhone: input.participantPhone,
        notes: input.notes ?? null,
      },
      links,
    )
    return withPreparedAgendaPropertySummary(event, propertySummary)
  }

  private async resolveEventTenant(input: CreateAgendaEventInput): Promise<string> {
    if (input.actorRole === 'RENTER') {
      if (input.ownerEmail || input.participantEmails?.length) {
        throw new AgendaRenterLinksForbiddenError()
      }
      if (!input.propertyId) throw new AgendaRenterPropertyRequiredError()

      const rented = await this.propertyRepository.findRentedProperty(
        input.actorUserId,
        input.propertyId,
      )

      if (!rented) throw new AgendaPropertyNotFoundError()

      return rented.tenantId
    }

    if (input.propertyId) {
      const property = await this.propertyRepository.findAccessibleProperty(
        input.actorTenantId,
        input.propertyId,
        isPropertyOwner(input.actorRole) ? input.actorUserId : undefined,
      )

      if (!property) throw new AgendaPropertyNotFoundError()
    }

    return input.actorTenantId
  }
}
