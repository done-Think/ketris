import { describe, expect, it, vi } from 'vitest'

import type { AgendaEvent } from '../../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { ListAgendaEventsUseCase } from '../../../application/use-cases/list-agenda-events.use-case'

const events: AgendaEvent[] = []

function createDeps() {
  const agendaEventRepository: AgendaEventRepository = {
    create: vi.fn(),
    list: vi.fn().mockResolvedValue(events),
    findByTenantAndId: vi.fn(),
    update: vi.fn(),
    reschedule: vi.fn(),
    cancel: vi.fn(),
    hasOverlap: vi.fn(),
  }

  return { agendaEventRepository }
}

describe('ListAgendaEventsUseCase', () => {
  it('repassa tenant, período e responsibleId pro repositório', async () => {
    const deps = createDeps()
    const useCase = new ListAgendaEventsUseCase(deps.agendaEventRepository)
    const from = new Date('2026-10-01T00:00:00.000Z')
    const to = new Date('2026-10-08T00:00:00.000Z')

    await useCase.execute({ actorTenantId: 'tenant-1', from, to, responsavelId: 'agent-1' })

    expect(deps.agendaEventRepository.list).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      from,
      to,
      responsavelId: 'agent-1',
    })
  })
})
