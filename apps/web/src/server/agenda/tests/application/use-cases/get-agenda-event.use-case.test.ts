import { describe, expect, it, vi } from 'vitest'

import { AgendaEventNotFoundError } from '../../../domain/errors'
import type { AgendaEvent } from '../../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { GetAgendaEventUseCase } from '../../../application/use-cases/get-agenda-event.use-case'

const event = { id: 'event-1', tenantId: 'tenant-1' } as AgendaEvent

function createDeps(overrides?: { findByScopeAndId?: AgendaEventRepository['findByScopeAndId'] }) {
  const agendaEventRepository: AgendaEventRepository = {
    create: vi.fn(),
    list: vi.fn(),
    findByScopeAndId: overrides?.findByScopeAndId ?? vi.fn().mockResolvedValue(event),
    findByTenantAndId: vi.fn(),
    update: vi.fn(),
    reschedule: vi.fn(),
    cancel: vi.fn(),
    hasOverlap: vi.fn(),
  }

  return { agendaEventRepository }
}

describe('GetAgendaEventUseCase', () => {
  it('consulta pelo escopo do tenant quando o ator é da equipe', async () => {
    const deps = createDeps()
    const useCase = new GetAgendaEventUseCase(deps.agendaEventRepository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorUserId: 'agent-1',
      actorPapel: 'AGENT',
      id: 'event-1',
    })

    expect(result).toBe(event)
    expect(deps.agendaEventRepository.findByScopeAndId).toHaveBeenCalledWith(
      { kind: 'agent', tenantId: 'tenant-1', userId: 'agent-1' },
      'event-1',
    )
  })

  it('consulta pelo vínculo com o próprio usuário quando o ator é RENTER', async () => {
    const deps = createDeps()
    const useCase = new GetAgendaEventUseCase(deps.agendaEventRepository)

    const result = await useCase.execute({
      actorTenantId: 'renters-tenant',
      actorUserId: 'renter-1',
      actorPapel: 'RENTER',
      id: 'event-1',
    })

    expect(result).toBe(event)
    expect(deps.agendaEventRepository.findByScopeAndId).toHaveBeenCalledWith(
      { kind: 'linkedUser', userId: 'renter-1' },
      'event-1',
    )
  })

  it.each([
    { actorPapel: 'AGENT' as const, reason: 'evento inexistente ou de outro tenant' },
    { actorPapel: 'RENTER' as const, reason: 'evento sem vínculo com o locatário' },
  ])('lança AgendaEventNotFoundError (404) para $actorPapel: $reason', async ({ actorPapel }) => {
    const deps = createDeps({ findByScopeAndId: vi.fn().mockResolvedValue(null) })
    const useCase = new GetAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorUserId: 'user-1',
        actorPapel,
        id: 'event-x',
      }),
    ).rejects.toThrow(AgendaEventNotFoundError)
  })
})
