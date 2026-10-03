import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { User } from '@server/auth/domain/user.entity'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import { PropertyNotFoundError } from '@server/properties/domain/errors'
import type { Property } from '@server/properties/domain/property.entity'
import type { PropertyRepository } from '@server/properties/application/ports/property-repository.port'

import {
  AgendaEventConflictError,
  AgendaMinimumAdvanceNoticeError,
  AgendaResponsibleNotFoundError,
} from '../../../domain/errors'
import type { AgendaEvent } from '../../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { CreateAgendaEventUseCase } from '../../../application/use-cases/create-agenda-event.use-case'

const actor: User = {
  id: 'agent-1',
  tenantId: 'tenant-1',
  nome: 'Corretor',
  email: 'corretor@ketris.dev',
  senhaHash: 'hash',
  papel: 'AGENT',
  ativo: true,
  vinculoAprovadoEm: new Date(),
}

const PINNED_NOW = new Date('2030-01-15T12:00:00.000Z')
const VALID_INICIO = new Date('2030-01-15T16:00:00.000Z')
const VALID_FIM = new Date('2030-01-15T17:00:00.000Z')

const createdEvent: AgendaEvent = {
  id: 'event-1',
  tenantId: 'tenant-1',
  responsavelId: 'agent-1',
  criadoPorId: 'agent-1',
  imovelId: null,
  referenciaImovelLivre: null,
  titulo: 'Visita ao imóvel',
  tipo: 'VISIT',
  status: 'CONFIRMED',
  inicio: VALID_INICIO,
  fim: VALID_FIM,
  participanteNome: 'Ana',
  participanteTelefone: '(11) 99999-0000',
  notas: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function createDeps(overrides?: {
  findById?: UserRepository['findById']
  findByTenantAndId?: PropertyRepository['findByTenantAndId']
  hasOverlap?: AgendaEventRepository['hasOverlap']
}) {
  const agendaEventRepository: AgendaEventRepository = {
    create: vi.fn().mockResolvedValue(createdEvent),
    list: vi.fn(),
    findByTenantAndId: vi.fn(),
    update: vi.fn(),
    reschedule: vi.fn(),
    cancel: vi.fn(),
    hasOverlap: overrides?.hasOverlap ?? vi.fn().mockResolvedValue(false),
  }
  const userRepository: UserRepository = {
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(actor),
    findByEmail: vi.fn(),
    findManyByTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    approveMembership: vi.fn(),
  }
  const propertyRepository: PropertyRepository = {
    create: vi.fn(),
    list: vi.fn(),
    findByTenantAndId:
      overrides?.findByTenantAndId ?? vi.fn().mockResolvedValue({ id: 'property-1' } as Property),
    update: vi.fn(),
    setStatus: vi.fn(),
    findContractProperty: vi.fn(),
    hasLinkedRecords: vi.fn(),
    delete: vi.fn(),
  }

  return { agendaEventRepository, userRepository, propertyRepository }
}

describe('CreateAgendaEventUseCase', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(PINNED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cria o evento atribuído ao próprio ator quando responsibleId não é informado', async () => {
    const deps = createDeps()
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorUserId: 'agent-1',
      actorPapel: 'AGENT',
      titulo: 'Visita ao imóvel',
      tipo: 'VISIT',
      inicio: VALID_INICIO,
      durationMinutes: 60,
      participanteNome: 'Ana',
      participanteTelefone: '(11) 99999-0000',
    })

    expect(deps.agendaEventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        responsavelId: 'agent-1',
        criadoPorId: 'agent-1',
        inicio: VALID_INICIO,
        fim: VALID_FIM,
      }),
    )
    expect(deps.userRepository.findById).not.toHaveBeenCalled()
  })

  it('lança ForbiddenError quando o ator é RENTER', async () => {
    const deps = createDeps()
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorUserId: 'renter-1',
        actorPapel: 'RENTER',
        titulo: 'Visita',
        inicio: VALID_INICIO,
        durationMinutes: 30,
        participanteNome: 'Ana',
        participanteTelefone: '11999990000',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.agendaEventRepository.create).not.toHaveBeenCalled()
  })

  it('lança AgendaResponsibleNotFoundError quando responsibleId não pertence ao tenant', async () => {
    const deps = createDeps({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorUserId: 'agent-1',
        actorPapel: 'AGENT',
        responsavelId: 'outro-agente',
        titulo: 'Visita',
        inicio: VALID_INICIO,
        durationMinutes: 30,
        participanteNome: 'Ana',
        participanteTelefone: '11999990000',
      }),
    ).rejects.toThrow(AgendaResponsibleNotFoundError)
    expect(deps.agendaEventRepository.create).not.toHaveBeenCalled()
  })

  it('lança PropertyNotFoundError quando propertyId não existe no tenant', async () => {
    const deps = createDeps({ findByTenantAndId: vi.fn().mockResolvedValue(null) })
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorUserId: 'agent-1',
        actorPapel: 'AGENT',
        imovelId: 'inexistente',
        titulo: 'Visita',
        inicio: VALID_INICIO,
        durationMinutes: 30,
        participanteNome: 'Ana',
        participanteTelefone: '11999990000',
      }),
    ).rejects.toThrow(PropertyNotFoundError)
    expect(deps.agendaEventRepository.create).not.toHaveBeenCalled()
  })

  it('lança AgendaMinimumAdvanceNoticeError quando o horário é menos de 3 horas no futuro', async () => {
    const deps = createDeps()
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorUserId: 'agent-1',
        actorPapel: 'AGENT',
        titulo: 'Visita',
        inicio: new Date(Date.now() + 60 * 60_000),
        durationMinutes: 30,
        participanteNome: 'Ana',
        participanteTelefone: '11999990000',
      }),
    ).rejects.toThrow(AgendaMinimumAdvanceNoticeError)
    expect(deps.agendaEventRepository.create).not.toHaveBeenCalled()
  })

  it('lança AgendaEventConflictError quando o responsável já tem evento nesse horário', async () => {
    const deps = createDeps({ hasOverlap: vi.fn().mockResolvedValue(true) })
    const useCase = new CreateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.userRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorUserId: 'agent-1',
        actorPapel: 'AGENT',
        titulo: 'Visita',
        inicio: VALID_INICIO,
        durationMinutes: 30,
        participanteNome: 'Ana',
        participanteTelefone: '11999990000',
      }),
    ).rejects.toThrow(AgendaEventConflictError)
    expect(deps.agendaEventRepository.create).not.toHaveBeenCalled()
  })
})
