import { describe, expect, it, vi } from 'vitest'

import {
  AgendaEventConflictError,
  AgendaEventNotFoundError,
  AgendaVisitMinimumDurationError,
} from '../../../domain/errors'
import type { AgendaEvent } from '../../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { RescheduleAgendaEventUseCase } from '../../../application/use-cases/reschedule-agenda-event.use-case'

const existingEvent: AgendaEvent = {
  id: 'event-1',
  tenantId: 'tenant-1',
  responsavelId: 'agent-1',
  criadoPorId: 'agent-1',
  imovelId: null,
  referenciaImovelLivre: null,
  titulo: 'Follow-up',
  tipo: 'FOLLOW_UP',
  status: 'CONFIRMED',
  inicio: new Date('2026-10-01T13:00:00.000Z'),
  fim: new Date('2026-10-01T14:00:00.000Z'),
  participanteNome: 'Ana',
  participanteTelefone: '(11) 99999-0000',
  notas: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const existingVisitEvent: AgendaEvent = { ...existingEvent, id: 'visit-1', tipo: 'VISIT' }

const rescheduledEvent: AgendaEvent = { ...existingEvent, status: 'CONFIRMED' }

function createDeps(overrides?: {
  reschedule?: AgendaEventRepository['reschedule']
  findByTenantAndId?: AgendaEventRepository['findByTenantAndId']
  hasOverlap?: AgendaEventRepository['hasOverlap']
}) {
  const agendaEventRepository: AgendaEventRepository = {
    create: vi.fn(),
    list: vi.fn(),
    findByTenantAndId: overrides?.findByTenantAndId ?? vi.fn().mockResolvedValue(existingEvent),
    update: vi.fn(),
    reschedule: overrides?.reschedule ?? vi.fn().mockResolvedValue(rescheduledEvent),
    cancel: vi.fn(),
    hasOverlap: overrides?.hasOverlap ?? vi.fn().mockResolvedValue(false),
  }

  return { agendaEventRepository }
}

describe('RescheduleAgendaEventUseCase', () => {
  it('mantém a duração original quando durationMinutes não é informado', async () => {
    const deps = createDeps()
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)
    const novoInicio = new Date('2026-10-02T10:00:00.000Z')

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'AGENT',
      id: 'event-1',
      inicio: novoInicio,
    })

    expect(deps.agendaEventRepository.reschedule).toHaveBeenCalledWith('tenant-1', 'event-1', {
      inicio: novoInicio,
      fim: new Date('2026-10-02T11:00:00.000Z'),
    })
  })

  it('usa a nova duração quando informada', async () => {
    const deps = createDeps()
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)
    const novoInicio = new Date('2026-10-02T10:00:00.000Z')

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'AGENT',
      id: 'event-1',
      inicio: novoInicio,
      durationMinutes: 30,
    })

    expect(deps.agendaEventRepository.reschedule).toHaveBeenCalledWith('tenant-1', 'event-1', {
      inicio: novoInicio,
      fim: new Date('2026-10-02T10:30:00.000Z'),
    })
  })

  it('lança ForbiddenError quando o ator é RENTER', async () => {
    const deps = createDeps()
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'RENTER',
        id: 'event-1',
        inicio: new Date(),
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.agendaEventRepository.reschedule).not.toHaveBeenCalled()
  })

  it('lança AgendaEventNotFoundError quando o evento não existe', async () => {
    const deps = createDeps({ findByTenantAndId: vi.fn().mockResolvedValue(null) })
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'AGENT',
        id: 'inexistente',
        inicio: new Date(),
      }),
    ).rejects.toThrow(AgendaEventNotFoundError)
  })

  it('lança AgendaEventNotFoundError quando o reschedule não encontra o evento', async () => {
    const deps = createDeps({ reschedule: vi.fn().mockResolvedValue(null) })
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'AGENT',
        id: 'event-1',
        inicio: new Date(),
        durationMinutes: 30,
      }),
    ).rejects.toThrow(AgendaEventNotFoundError)
  })

  it('lança AgendaEventConflictError quando o novo horário colide com outro evento do responsável', async () => {
    const deps = createDeps({ hasOverlap: vi.fn().mockResolvedValue(true) })
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'AGENT',
        id: 'event-1',
        inicio: new Date('2026-10-02T10:00:00.000Z'),
      }),
    ).rejects.toThrow(AgendaEventConflictError)
    expect(deps.agendaEventRepository.reschedule).not.toHaveBeenCalled()
  })

  it('exclui o próprio evento da checagem de conflito', async () => {
    const deps = createDeps()
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)
    const novoInicio = new Date('2026-10-02T10:00:00.000Z')

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'AGENT',
      id: 'event-1',
      inicio: novoInicio,
    })

    expect(deps.agendaEventRepository.hasOverlap).toHaveBeenCalledWith(
      'tenant-1',
      'agent-1',
      novoInicio,
      new Date('2026-10-02T11:00:00.000Z'),
      'event-1',
    )
  })

  it('lança AgendaVisitMinimumDurationError ao reagendar uma VISIT para menos de 60min', async () => {
    const deps = createDeps({ findByTenantAndId: vi.fn().mockResolvedValue(existingVisitEvent) })
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'AGENT',
        id: 'visit-1',
        inicio: new Date('2026-10-02T10:00:00.000Z'),
        durationMinutes: 30,
      }),
    ).rejects.toThrow(AgendaVisitMinimumDurationError)
    expect(deps.agendaEventRepository.reschedule).not.toHaveBeenCalled()
  })

  it('permite reagendar uma VISIT mantendo 60min ou mais', async () => {
    const deps = createDeps({ findByTenantAndId: vi.fn().mockResolvedValue(existingVisitEvent) })
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'AGENT',
      id: 'visit-1',
      inicio: new Date('2026-10-02T10:00:00.000Z'),
    })

    expect(deps.agendaEventRepository.reschedule).toHaveBeenCalled()
  })
})
