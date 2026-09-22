import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import { PropertyNotFoundError } from '@server/properties/domain/errors'
import type { PropertyRepository } from '@server/properties/application/ports/property-repository.port'

import { AgendaEventConflictError, AgendaResponsibleNotFoundError } from '../../domain/errors'
import type { AgendaEventKind } from '../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../ports/agenda-event-repository.port'

export interface CreateAgendaEventInput {
  actorTenantId: string
  actorUserId: string
  actorPapel: Papel
  responsavelId?: string
  imovelId?: string | null
  referenciaImovelLivre?: string | null
  titulo: string
  tipo?: AgendaEventKind | null
  inicio: Date
  durationMinutes: number
  participanteNome: string
  participanteTelefone: string
  notas?: string | null
}

export class CreateAgendaEventUseCase {
  constructor(
    private readonly agendaEventRepository: AgendaEventRepository,
    private readonly userRepository: UserRepository,
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(input: CreateAgendaEventInput) {
    if (input.actorPapel === 'RENTER') {
      throw new ForbiddenError('Locatários não podem gerenciar a agenda.')
    }

    const responsavelId = input.responsavelId ?? input.actorUserId

    if (responsavelId !== input.actorUserId) {
      await this.assertResponsibleBelongsToTenant(input.actorTenantId, responsavelId)
    }

    if (input.imovelId) {
      const property = await this.propertyRepository.findByTenantAndId(
        input.actorTenantId,
        input.imovelId,
      )

      if (!property) {
        throw new PropertyNotFoundError()
      }
    }

    const inicio = input.inicio
    const fim = new Date(inicio.getTime() + input.durationMinutes * 60_000)

    const conflict = await this.agendaEventRepository.hasOverlap(
      input.actorTenantId,
      responsavelId,
      inicio,
      fim,
    )

    if (conflict) {
      throw new AgendaEventConflictError()
    }

    return this.agendaEventRepository.create({
      tenantId: input.actorTenantId,
      responsavelId,
      criadoPorId: input.actorUserId,
      imovelId: input.imovelId ?? null,
      referenciaImovelLivre: input.referenciaImovelLivre ?? null,
      titulo: input.titulo,
      tipo: input.tipo ?? null,
      inicio,
      fim,
      participanteNome: input.participanteNome,
      participanteTelefone: input.participanteTelefone,
      notas: input.notas ?? null,
    })
  }

  private async assertResponsibleBelongsToTenant(tenantId: string, responsavelId: string) {
    const responsible = await this.userRepository.findById(responsavelId)

    if (!responsible || responsible.tenantId !== tenantId || responsible.papel === 'RENTER') {
      throw new AgendaResponsibleNotFoundError()
    }
  }
}
