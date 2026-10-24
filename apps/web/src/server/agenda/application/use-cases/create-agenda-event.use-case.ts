import { isPropertyOwner } from '@server/auth/domain/roles'
import type { Papel } from '@server/auth/domain/user.entity'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import { PropertyNotFoundError } from '@server/properties/domain/errors'
import type { PropertyRepository } from '@server/properties/application/ports/property-repository.port'

import { assertCanChooseAgendaAudience } from '../../domain/agenda-access-rules'
import { normalizeAgendaEventLinks } from '../../domain/agenda-event-links'
import { assertWithinAgendaSchedulingWindow } from '../../domain/agenda-scheduling-rules'
import {
  AgendaEventConflictError,
  AgendaRenterLinksForbiddenError,
  AgendaRenterPropertyRequiredError,
  AgendaResponsibleNotFoundError,
} from '../../domain/errors'
import type { AgendaEventKind, AgendaEventAudience } from '../../domain/agenda-event.entity'
import { ConflictError } from '@server/shared/errors'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'
import { validateAgendaResponsible } from '../validate-agenda-responsible'
import { AGENDA_MINIMUM_VISIT_MINUTES } from '@shared/lib/utils/agenda-scheduling'
import { AgendaVisitMinimumDurationError } from '../../domain/errors'

export interface CreateAgendaEventInput {
  outsideBusinessHoursConfirmed?: boolean
  actorTenantId: string
  actorUserId: string
  actorPapel: Papel
  responsavelId?: string
  destino?: AgendaEventAudience
  interno?: boolean
  imovelId?: string | null
  referenciaImovelLivre?: string | null
  titulo: string
  tipo?: AgendaEventKind | null
  inicio: Date
  durationMinutes: number
  participanteNome: string
  participanteTelefone: string
  notas?: string | null
  donoEmail?: string
  participanteEmails?: string[]
}

export class CreateAgendaEventUseCase {
  constructor(
    private readonly agendaEventRepository: AgendaEventRepository,
    private readonly userRepository: UserRepository,
    private readonly propertyRepository: PropertyRepository,
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
        input.destino === 'LEGACY_TEAM')
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

    return this.agendaEventRepository.create(
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
  }

  private async resolveEventTenant(input: CreateAgendaEventInput): Promise<string> {
    if (input.actorPapel === 'RENTER') {
      if (input.donoEmail || input.participanteEmails?.length) {
        throw new AgendaRenterLinksForbiddenError()
      }
      if (!input.imovelId) throw new AgendaRenterPropertyRequiredError()

      const rented = await this.propertyRepository.findRenterContractProperty(
        input.actorUserId,
        input.imovelId,
      )

      if (!rented) throw new PropertyNotFoundError()

      return rented.tenantId
    }

    if (input.imovelId) {
      const property = await this.propertyRepository.findByTenantAndId(
        input.actorTenantId,
        input.imovelId,
        undefined,
        isPropertyOwner(input.actorPapel) ? input.actorUserId : undefined,
      )

      if (!property) throw new PropertyNotFoundError()
    }

    return input.actorTenantId
  }
}
