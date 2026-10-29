import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AgendaEventConflictError,
  AgendaEventNotFoundError,
  AgendaMinimumAdvanceNoticeError,
  AgendaOutsideBusinessHoursError,
  AgendaVisitMinimumDurationError,
} from '../../../domain/errors'
import type { AgendaEvent } from '../../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { RescheduleAgendaEventUseCase } from '../../../application/use-cases/reschedule-agenda-event.use-case'

const PINNED_NOW = new Date('2030-01-15T12:00:00.000Z')
const EXISTING_INICIO = new Date('2030-01-15T16:00:00.000Z')
const EXISTING_FIM = new Date('2030-01-15T17:00:00.000Z')
const NEW_VALID_INICIO = new Date('2030-01-16T16:00:00.000Z')
const OUTSIDE_BUSINESS_HOURS_INICIO = new Date('2030-01-16T22:00:00.000Z')

const existingEvent: AgendaEvent = {
  id: 'event-1',
  tenantId: 'tenant-1',
  responsibleId: 'agent-1',
  createdById: 'agent-1',
  responsibleName: 'Corretor',
  ownerUserId: null,
  dono: null,
  participants: [],
  propertyId: null,
  freeFormPropertyReference: null,
  title: 'Follow-up',
  type: 'FOLLOW_UP',
  status: 'CONFIRMED',
  start: EXISTING_INICIO,
  end: EXISTING_FIM,
  participantName: 'Ana',
  participantPhone: '(11) 99999-0000',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const existingVisitEvent: AgendaEvent = { ...existingEvent, id: 'visit-1', type: 'VISIT' }

const rescheduledEvent: AgendaEvent = { ...existingEvent, status: 'CONFIRMED' }

function createDeps(overrides?: {
  reschedule?: AgendaEventRepository['reschedule']
  findByTenantAndId?: AgendaEventRepository['findByTenantAndId']
  hasOverlap?: AgendaEventRepository['hasOverlap']
}) {
  const agendaEventRepository: AgendaEventRepository = {
    create: vi.fn(),
    list: vi.fn(),
    findByScopeAndId: vi.fn(),
    findByTenantAndId: overrides?.findByTenantAndId ?? vi.fn().mockResolvedValue(existingEvent),
    update: vi.fn(),
    reschedule: overrides?.reschedule ?? vi.fn().mockResolvedValue(rescheduledEvent),
    cancel: vi.fn(),
    hasOverlap: overrides?.hasOverlap ?? vi.fn().mockResolvedValue(false),
  }

  return { agendaEventRepository }
}

describe('RescheduleAgendaEventUseCase', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(PINNED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('mantém a duração original quando durationMinutes não é informado', async () => {
    const deps = createDeps()
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)
    const newStart = NEW_VALID_INICIO

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'AGENT',
      id: 'event-1',
      start: newStart,
    })

    expect(deps.agendaEventRepository.reschedule).toHaveBeenCalledWith(
      'tenant-1',
      'event-1',
      {
        start: newStart,
        end: new Date(newStart.getTime() + 60 * 60_000),
      },
      undefined,
    )
  })

  it('usa a nova duração quando informada', async () => {
    const deps = createDeps()
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)
    const newStart = NEW_VALID_INICIO

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'AGENT',
      id: 'event-1',
      start: newStart,
      durationMinutes: 30,
    })

    expect(deps.agendaEventRepository.reschedule).toHaveBeenCalledWith(
      'tenant-1',
      'event-1',
      {
        start: newStart,
        end: new Date(newStart.getTime() + 30 * 60_000),
      },
      undefined,
    )
  })

  it('o RENTER não remarca evento criado por outra pessoa', async () => {
    const deps = createDeps()
    vi.mocked(deps.agendaEventRepository.findByScopeAndId).mockResolvedValue({
      id: 'event-1',
      tenantId: 'agency-1',
      responsibleId: 'agent-1',
      createdById: 'agent-1',
    } as AgendaEvent)
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'renters',
        actorUserId: 'renter-1',
        actorRole: 'RENTER',
        id: 'event-1',
        start: new Date(),
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
        actorRole: 'AGENT',
        id: 'inexistente',
        start: new Date(),
      }),
    ).rejects.toThrow(AgendaEventNotFoundError)
  })

  it('lança AgendaEventNotFoundError quando o reschedule não encontra o evento', async () => {
    const deps = createDeps({ reschedule: vi.fn().mockResolvedValue(null) })
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorRole: 'AGENT',
        id: 'event-1',
        start: NEW_VALID_INICIO,
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
        actorRole: 'AGENT',
        id: 'event-1',
        start: NEW_VALID_INICIO,
      }),
    ).rejects.toThrow(AgendaEventConflictError)
    expect(deps.agendaEventRepository.reschedule).not.toHaveBeenCalled()
  })

  it('exclui o próprio evento da checagem de conflito', async () => {
    const deps = createDeps()
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)
    const newStart = NEW_VALID_INICIO

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'AGENT',
      id: 'event-1',
      start: newStart,
    })

    expect(deps.agendaEventRepository.hasOverlap).toHaveBeenCalledWith(
      'tenant-1',
      'agent-1',
      newStart,
      new Date(newStart.getTime() + 60 * 60_000),
      'event-1',
    )
  })

  it('lança AgendaOutsideBusinessHoursError ao reagendar para fora do horário comercial', async () => {
    const deps = createDeps()
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorRole: 'AGENT',
        id: 'event-1',
        start: OUTSIDE_BUSINESS_HOURS_INICIO,
      }),
    ).rejects.toThrow(AgendaOutsideBusinessHoursError)
    expect(deps.agendaEventRepository.reschedule).not.toHaveBeenCalled()
  })

  it('lança AgendaMinimumAdvanceNoticeError ao reagendar para menos de 3 horas no futuro', async () => {
    const deps = createDeps()
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorRole: 'AGENT',
        id: 'event-1',
        start: new Date(Date.now() + 60 * 60_000),
      }),
    ).rejects.toThrow(AgendaMinimumAdvanceNoticeError)
    expect(deps.agendaEventRepository.reschedule).not.toHaveBeenCalled()
  })

  it('não reaplica a checagem de janela quando o horário permanece o mesmo', async () => {
    const deps = createDeps()
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'AGENT',
      id: 'event-1',
      start: existingEvent.start,
      durationMinutes: 90,
    })

    expect(deps.agendaEventRepository.reschedule).toHaveBeenCalledWith(
      'tenant-1',
      'event-1',
      {
        start: existingEvent.start,
        end: new Date(existingEvent.start.getTime() + 90 * 60_000),
      },
      undefined,
    )
  })

  it('lança AgendaVisitMinimumDurationError ao reagendar uma VISIT para menos de 30min', async () => {
    const deps = createDeps({ findByTenantAndId: vi.fn().mockResolvedValue(existingVisitEvent) })
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorRole: 'AGENT',
        id: 'visit-1',
        start: NEW_VALID_INICIO,
        durationMinutes: 15,
      }),
    ).rejects.toThrow(AgendaVisitMinimumDurationError)
    expect(deps.agendaEventRepository.reschedule).not.toHaveBeenCalled()
  })

  it('permite reagendar uma VISIT mantendo 30min ou mais', async () => {
    const deps = createDeps({ findByTenantAndId: vi.fn().mockResolvedValue(existingVisitEvent) })
    const useCase = new RescheduleAgendaEventUseCase(deps.agendaEventRepository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'AGENT',
      id: 'visit-1',
      start: NEW_VALID_INICIO,
    })

    expect(deps.agendaEventRepository.reschedule).toHaveBeenCalled()
  })
})
