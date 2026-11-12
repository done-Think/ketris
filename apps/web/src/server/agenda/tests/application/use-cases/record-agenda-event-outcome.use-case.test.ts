import { describe, expect, it, vi } from 'vitest'

import type { AgendaEvent } from '../../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { RecordAgendaEventOutcomeUseCase } from '../../../application/use-cases/record-agenda-event-outcome.use-case'

const now = new Date('2026-11-04T15:00:00.000Z')

const openVisit = {
  id: 'event-1',
  tenantId: 'tenant-1',
  responsibleId: 'agent-1',
  createdById: 'owner-1',
  audience: 'ASSIGNED_AGENT',
  internal: false,
  type: 'VISIT',
  status: 'CONFIRMED',
  propertyId: null,
  start: new Date('2026-11-04T13:30:00.000Z'),
  end: new Date('2026-11-04T14:30:00.000Z'),
} as AgendaEvent

const completedVisit = { ...openVisit, status: 'COMPLETED' } as AgendaEvent

function createDeps(existing: AgendaEvent | null = openVisit) {
  const agendaEventRepository: AgendaEventRepository = {
    create: vi.fn(),
    list: vi.fn(),
    findByScopeAndId: vi.fn(),
    findByTenantAndId: vi.fn().mockResolvedValue(existing),
    update: vi.fn(),
    reschedule: vi.fn(),
    cancel: vi.fn(),
    recordOutcome: vi.fn().mockResolvedValue(completedVisit),
    hasOverlap: vi.fn(),
  }
  const useCase = new RecordAgendaEventOutcomeUseCase(agendaEventRepository, undefined, () => now)

  return { agendaEventRepository, useCase }
}

describe('RecordAgendaEventOutcomeUseCase', () => {
  it('registra a visita realizada com o status esperado, o autor e as anotações aparadas', async () => {
    const { agendaEventRepository, useCase } = createDeps()

    const result = await useCase.execute({
      outcome: 'COMPLETED',
      visitInterest: 'MEDIUM',
      notes: '  Gostou da cozinha.  ',
      actorTenantId: 'tenant-1',
      actorRole: 'AGENT',
      actorUserId: 'agent-1',
      id: 'event-1',
    })

    expect(result).toBe(completedVisit)
    expect(agendaEventRepository.findByTenantAndId).toHaveBeenCalledWith('tenant-1', 'event-1')
    expect(agendaEventRepository.recordOutcome).toHaveBeenCalledWith('tenant-1', 'event-1', {
      outcome: 'COMPLETED',
      expectedStatus: 'CONFIRMED',
      visitInterest: 'MEDIUM',
      notes: 'Gostou da cozinha.',
      actorUserId: 'agent-1',
    })
  })

  it('grava anotações em branco como nulas', async () => {
    const { agendaEventRepository, useCase } = createDeps()

    await useCase.execute({
      outcome: 'NO_SHOW',
      notes: '   ',
      actorTenantId: 'tenant-1',
      actorRole: 'AGENT',
      actorUserId: 'agent-1',
      id: 'event-1',
    })

    expect(agendaEventRepository.recordOutcome).toHaveBeenCalledWith(
      'tenant-1',
      'event-1',
      expect.objectContaining({ outcome: 'NO_SHOW', visitInterest: null, notes: null }),
    )
  })

  it('o OWNER corrige um resultado já registrado, informando o status atual', async () => {
    const { agendaEventRepository, useCase } = createDeps(completedVisit)

    await useCase.execute({
      outcome: 'NO_SHOW',
      actorTenantId: 'tenant-1',
      actorRole: 'OWNER',
      actorUserId: 'owner-1',
      id: 'event-1',
    })

    expect(agendaEventRepository.recordOutcome).toHaveBeenCalledWith(
      'tenant-1',
      'event-1',
      expect.objectContaining({ outcome: 'NO_SHOW', expectedStatus: 'COMPLETED' }),
    )
  })

  it('devolve 404 para evento de outro tenant ou inexistente, sem gravar', async () => {
    const { agendaEventRepository, useCase } = createDeps(null)

    await expect(
      useCase.execute({
        outcome: 'COMPLETED',
        visitInterest: 'HIGH',
        actorTenantId: 'tenant-2',
        actorRole: 'OWNER',
        actorUserId: 'owner-2',
        id: 'event-1',
      }),
    ).rejects.toMatchObject({ status: 404 })
    expect(agendaEventRepository.recordOutcome).not.toHaveBeenCalled()
  })

  it('o RENTER procura só nos eventos vinculados e não registra resultado', async () => {
    const { agendaEventRepository, useCase } = createDeps()
    vi.mocked(agendaEventRepository.findByScopeAndId).mockResolvedValue({
      ...openVisit,
      createdById: 'renter-1',
    } as AgendaEvent)

    await expect(
      useCase.execute({
        outcome: 'COMPLETED',
        visitInterest: 'HIGH',
        actorTenantId: 'renters',
        actorRole: 'RENTER',
        actorUserId: 'renter-1',
        id: 'event-1',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(agendaEventRepository.findByScopeAndId).toHaveBeenCalledWith(
      { kind: 'linkedUser', userId: 'renter-1' },
      'event-1',
    )
    expect(agendaEventRepository.recordOutcome).not.toHaveBeenCalled()
  })

  it('usa o relógio injetado para recusar evento que ainda não começou', async () => {
    const { agendaEventRepository, useCase } = createDeps({
      ...openVisit,
      start: new Date('2026-11-04T16:00:00.000Z'),
    } as AgendaEvent)

    await expect(
      useCase.execute({
        outcome: 'COMPLETED',
        visitInterest: 'HIGH',
        actorTenantId: 'tenant-1',
        actorRole: 'AGENT',
        actorUserId: 'agent-1',
        id: 'event-1',
      }),
    ).rejects.toMatchObject({ code: 'AGENDA_OUTCOME_BEFORE_START' })
    expect(agendaEventRepository.recordOutcome).not.toHaveBeenCalled()
  })

  it('devolve 404 quando o evento some entre a leitura e a gravação', async () => {
    const { agendaEventRepository, useCase } = createDeps()
    vi.mocked(agendaEventRepository.recordOutcome).mockResolvedValue(null)

    await expect(
      useCase.execute({
        outcome: 'COMPLETED',
        visitInterest: 'HIGH',
        actorTenantId: 'tenant-1',
        actorRole: 'AGENT',
        actorUserId: 'agent-1',
        id: 'event-1',
      }),
    ).rejects.toMatchObject({ status: 404 })
  })
})
