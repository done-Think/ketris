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
    findByTenantAndId: vi.fn(),
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
      actorTenantId: 'tenant-1',
      actorPapel: 'AGENT',
      id: 'event-1',
    })

    expect(result).toBe(cancelledEvent)
    expect(deps.agendaEventRepository.cancel).toHaveBeenCalledWith('tenant-1', 'event-1')
  })

  it('lança ForbiddenError quando o ator é RENTER', async () => {
    const deps = createDeps()
    const useCase = new CancelAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'RENTER', id: 'event-1' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.agendaEventRepository.cancel).not.toHaveBeenCalled()
  })

  it('lança AgendaEventNotFoundError quando o evento não existe no tenant', async () => {
    const deps = createDeps({ cancel: vi.fn().mockResolvedValue(null) })
    const useCase = new CancelAgendaEventUseCase(deps.agendaEventRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'AGENT', id: 'inexistente' }),
    ).rejects.toThrow(AgendaEventNotFoundError)
  })
})
