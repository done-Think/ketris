import { describe, expect, it, vi } from 'vitest'

import type { User } from '@server/auth/domain/user.entity'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import { PropertyNotFoundError } from '@server/properties/domain/errors'
import type { Property } from '@server/properties/domain/property.entity'
import type { PropertyRepository } from '@server/properties/application/ports/property-repository.port'

import { AgendaEventConflictError, AgendaResponsibleNotFoundError } from '../../../domain/errors'
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
  inicio: new Date('2026-10-01T13:00:00.000Z'),
  fim: new Date('2026-10-01T14:00:00.000Z'),
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
      inicio: new Date('2026-10-01T13:00:00.000Z'),
      durationMinutes: 60,
      participanteNome: 'Ana',
      participanteTelefone: '(11) 99999-0000',
    })

    expect(deps.agendaEventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        responsavelId: 'agent-1',
        criadoPorId: 'agent-1',
        inicio: new Date('2026-10-01T13:00:00.000Z'),
        fim: new Date('2026-10-01T14:00:00.000Z'),
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
        inicio: new Date(),
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
        inicio: new Date(),
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
        inicio: new Date(),
        durationMinutes: 30,
        participanteNome: 'Ana',
        participanteTelefone: '11999990000',
      }),
    ).rejects.toThrow(PropertyNotFoundError)
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
        inicio: new Date('2026-10-01T13:00:00.000Z'),
        durationMinutes: 30,
        participanteNome: 'Ana',
        participanteTelefone: '11999990000',
      }),
    ).rejects.toThrow(AgendaEventConflictError)
    expect(deps.agendaEventRepository.create).not.toHaveBeenCalled()
  })
})
