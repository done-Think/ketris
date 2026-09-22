import { describe, expect, it, vi } from 'vitest'

import { PropertyNotFoundError } from '@server/properties/domain/errors'
import type { Property } from '@server/properties/domain/property.entity'
import type { PropertyRepository } from '@server/properties/application/ports/property-repository.port'

import { AgendaEventNotFoundError, AgendaVisitMinimumDurationError } from '../../../domain/errors'
import type { AgendaEvent } from '../../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { UpdateAgendaEventUseCase } from '../../../application/use-cases/update-agenda-event.use-case'

const updatedEvent = { id: 'event-1', titulo: 'Atualizado' } as AgendaEvent

const shortEvent: AgendaEvent = {
  id: 'event-1',
  tenantId: 'tenant-1',
  responsavelId: 'agent-1',
  criadoPorId: 'agent-1',
  imovelId: null,
  referenciaImovelLivre: null,
  titulo: 'Follow-up rápido',
  tipo: 'FOLLOW_UP',
  status: 'CONFIRMED',
  inicio: new Date('2026-10-01T13:00:00.000Z'),
  fim: new Date('2026-10-01T13:30:00.000Z'),
  participanteNome: 'Ana',
  participanteTelefone: '11999990000',
  notas: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function createDeps(overrides?: {
  update?: AgendaEventRepository['update']
  findByTenantAndId?: PropertyRepository['findByTenantAndId']
  agendaFindByTenantAndId?: AgendaEventRepository['findByTenantAndId']
}) {
  const agendaEventRepository: AgendaEventRepository = {
    create: vi.fn(),
    list: vi.fn(),
    findByTenantAndId: overrides?.agendaFindByTenantAndId ?? vi.fn().mockResolvedValue(shortEvent),
    update: overrides?.update ?? vi.fn().mockResolvedValue(updatedEvent),
    reschedule: vi.fn(),
    cancel: vi.fn(),
    hasOverlap: vi.fn(),
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

  return { agendaEventRepository, propertyRepository }
}

describe('UpdateAgendaEventUseCase', () => {
  it('atualiza o evento com os campos informados', async () => {
    const deps = createDeps()
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
    )

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'AGENT',
      id: 'event-1',
      titulo: 'Atualizado',
    })

    expect(result).toBe(updatedEvent)
    expect(deps.agendaEventRepository.update).toHaveBeenCalledWith(
      'tenant-1',
      'event-1',
      expect.objectContaining({ titulo: 'Atualizado' }),
    )
  })

  it('lança ForbiddenError quando o ator é RENTER', async () => {
    const deps = createDeps()
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'RENTER',
        id: 'event-1',
        titulo: 'X',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.agendaEventRepository.update).not.toHaveBeenCalled()
  })

  it('lança PropertyNotFoundError quando o novo imovelId não existe no tenant', async () => {
    const deps = createDeps({ findByTenantAndId: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'AGENT',
        id: 'event-1',
        imovelId: 'inexistente',
      }),
    ).rejects.toThrow(PropertyNotFoundError)
  })

  it('lança AgendaEventNotFoundError quando o evento não existe no tenant', async () => {
    const deps = createDeps({ update: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'AGENT', id: 'inexistente' }),
    ).rejects.toThrow(AgendaEventNotFoundError)
  })

  it('lança AgendaVisitMinimumDurationError ao marcar como VISIT um evento com menos de 60min', async () => {
    const deps = createDeps()
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'AGENT',
        id: 'event-1',
        tipo: 'VISIT',
      }),
    ).rejects.toThrow(AgendaVisitMinimumDurationError)
    expect(deps.agendaEventRepository.update).not.toHaveBeenCalled()
  })

  it('permite marcar como VISIT um evento que já dura 60min ou mais', async () => {
    const longEvent = {
      ...shortEvent,
      fim: new Date('2026-10-01T14:00:00.000Z'),
    }
    const deps = createDeps({ agendaFindByTenantAndId: vi.fn().mockResolvedValue(longEvent) })
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'AGENT',
      id: 'event-1',
      tipo: 'VISIT',
    })

    expect(deps.agendaEventRepository.update).toHaveBeenCalled()
  })
})
