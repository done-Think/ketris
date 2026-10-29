import { describe, expect, it, vi } from 'vitest'

import { AgendaEventNotFoundError } from '../../../domain/errors'
import type { AgendaEvent } from '../../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { CancelAgendaEventUseCase } from '../../../application/use-cases/cancel-agenda-event.use-case'

const cancelledEvent = { id: 'event-1', status: 'CANCELLED' } as AgendaEvent

function createDeps(overrides?: { cancel?: AgendaEventRepository['cancel'] }) {
  const agendaEventRepository: AgendaEventRepository = {
    create: vi.fn(),
    list: vi.fn(),
    findByScopeAndId: vi.fn(),
    findByTenantAndId: vi.fn().mockResolvedValue(cancelledEvent),
    update: vi.fn(),
    reschedule: vi.fn(),
    cancel: overrides?.cancel ?? vi.fn().mockResolvedValue(cancelledEvent),
    hasOverlap: vi.fn(),
  }

  return { agendaEventRepository }
}

describe('CancelAgendaEventUseCase', () => {
  it('cancela o evento', async () => {
    const deps = createDeps()
    const useCase = new CancelAgendaEventUseCase(deps.agendaEventRepository)

    const result = await useCase.execute({
      reason: 'Cliente indisponível',
      actorTenantId: 'tenant-1',
      actorRole: 'AGENT',
      id: 'event-1',
    })

    expect(result).toBe(cancelledEvent)
    expect(deps.agendaEventRepository.cancel).toHaveBeenCalledWith('tenant-1', 'event-1', {
      reason: 'Cliente indisponível',
      actorUserId: undefined,
    })
  })

  it('o RENTER cancela o evento que criou, na agenda da imobiliária', async () => {
    const deps = createDeps()
    vi.mocked(deps.agendaEventRepository.findByScopeAndId).mockResolvedValue({
      ...cancelledEvent,
      tenantId: 'agency-1',
      createdById: 'renter-1',
    } as AgendaEvent)
    const useCase = new CancelAgendaEventUseCase(deps.agendaEventRepository)

    await useCase.execute({
      reason: 'Cliente indisponível',
      actorTenantId: 'renters',
      actorUserId: 'renter-1',
      actorRole: 'RENTER',
      id: 'event-1',
    })

    expect(deps.agendaEventRepository.findByScopeAndId).toHaveBeenCalledWith(
      { kind: 'linkedUser', userId: 'renter-1' },
      'event-1',
    )
    expect(deps.agendaEventRepository.cancel).toHaveBeenCalledWith('agency-1', 'event-1', {
      reason: 'Cliente indisponível',
      actorUserId: 'renter-1',
    })
  })

  it('o RENTER não cancela evento criado por outra pessoa', async () => {
    const deps = createDeps()
    vi.mocked(deps.agendaEventRepository.findByScopeAndId).mockResolvedValue({
      ...cancelledEvent,
      tenantId: 'agency-1',
      responsibleId: 'agent-1',
      createdById: 'agent-1',
    } as AgendaEvent)
    const useCase = new CancelAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({
        reason: 'Cliente indisponível',
        actorTenantId: 'renters',
        actorUserId: 'renter-1',
        actorRole: 'RENTER',
        id: 'event-1',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.agendaEventRepository.cancel).not.toHaveBeenCalled()
  })

  it('lança AgendaEventNotFoundError quando o evento não existe no tenant', async () => {
    const deps = createDeps({ cancel: vi.fn().mockResolvedValue(null) })
    const useCase = new CancelAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({
        reason: 'Cliente indisponível',
        actorTenantId: 'tenant-1',
        actorRole: 'AGENT',
        id: 'inexistente',
      }),
    ).rejects.toThrow(AgendaEventNotFoundError)
  })
})
