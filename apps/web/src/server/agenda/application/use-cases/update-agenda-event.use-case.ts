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
    assertCanManageAgendaEvent(input.actorRole, input.actorUserId, existing)
    if (
      !isAgencyManager(input.actorRole) &&
      ((input.audience !== undefined && input.audience !== (existing.audience ?? 'SHARED_TEAM')) ||
        (input.internal !== undefined && input.internal !== Boolean(existing.internal)) ||
        (input.responsibleId !== undefined && input.responsibleId !== existing.responsibleId))
    )
      throw new ForbiddenError()

    const audience = input.audience ?? existing.audience ?? 'SHARED_TEAM'
    const internal = input.internal ?? existing.internal ?? false
    const responsibleId = input.responsibleId ?? existing.responsibleId
    if (
      input.responsibleId !== undefined ||
      (input.audience !== undefined && audience === 'ASSIGNED_AGENT')
    ) {
      await validateAgendaResponsible(
        this.userRepository,
        manageableAgendaEventTenantId(input, existing),
        responsibleId,
        audience === 'ASSIGNED_AGENT',
      )
    }
    if (
      internal &&
      (audience === 'SHARED_TEAM' || input.ownerEmail || input.participantEmails?.length)
    ) {
      throw new ConflictError('Eventos internos são destinados apenas à equipe da imobiliária.')
    }
    if (
      !internal &&
      ((input.participantName ?? existing.participantName).trim().length < 2 ||
        !(input.participantPhone ?? existing.participantPhone).trim() ||
        (audience !== 'SHARED_TEAM' &&
          !(input.propertyId !== undefined ? input.propertyId : existing.propertyId) &&
          !(input.freeFormPropertyReference !== undefined
            ? input.freeFormPropertyReference
            : existing.freeFormPropertyReference)))
    )
      throw new ConflictError('Informe imóvel, cliente e telefone para eventos com cliente.')

    if (input.actorRole === 'RENTER') {
      if (input.ownerEmail || input.participantEmails?.length) {
        throw new AgendaRenterLinksForbiddenError()
      }
      if (input.freeFormPropertyReference) throw new AgendaRenterPropertyRequiredError()
    }

    if (input.propertyId) {
      const property =
        input.actorRole === 'RENTER'
          ? await this.propertyRepository.findRentedProperty(
              input.actorUserId ?? '',
              input.propertyId,
            )
          : await this.propertyRepository.findAccessibleProperty(
              manageableAgendaEventTenantId(input, existing),
              input.propertyId,
              isPropertyOwner(input.actorRole) ? input.actorUserId : undefined,
            )

      if (!property || property.tenantId !== manageableAgendaEventTenantId(input, existing)) {
        throw new AgendaPropertyNotFoundError()
      }
    }

    const schedule =
      input.start !== undefined ||
      input.durationMinutes !== undefined ||
      input.responsibleId !== undefined
        ? await validateAgendaSchedule(this.agendaEventRepository, existing, input)
        : undefined
    if (!schedule && input.type === 'VISIT') {
      const durationMinutes = (existing.end.getTime() - existing.start.getTime()) / 60_000

      if (durationMinutes < AGENDA_MINIMUM_VISIT_MINUTES) {
        throw new AgendaVisitMinimumDurationError()
      }
    }

    if (input.status === 'CANCELLED' && !input.cancellationReason?.trim())
      throw new AgendaCancellationReasonRequiredError()

    const propertySummary = await prepareAgendaPropertySummary(
      this.propertyCatalog,
      input,
      input.propertyId === undefined ? existing.propertyId : input.propertyId,
    )

    const event = await this.agendaEventRepository.update(
      manageableAgendaEventTenantId(input, existing),
      input.id,
      {
        ...schedule,
        title: input.title,
        type: input.type,
        audience: input.audience,
        internal: input.internal,
        responsibleId: input.responsibleId,
        status: input.status,
        cancellationReason: input.cancellationReason,
        propertyId: input.propertyId,
        freeFormPropertyReference: input.freeFormPropertyReference,
        participantName: input.participantName,
        participantPhone: input.participantPhone,
        notes: input.notes,
      },
      normalizeAgendaEventLinks({
        ownerEmail: internal ? null : input.ownerEmail,
        participantEmails: internal ? [] : input.participantEmails,
      }),
      input.actorUserId,
    )

    if (!event) {
      throw new AgendaEventNotFoundError()
    }

    return withPreparedAgendaPropertySummary(event, propertySummary)
  }
}
