import { describe, expect, it, vi } from 'vitest'

import { AgendaEventNotFoundError } from '../../../domain/errors'
import type { AgendaEvent } from '../../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { GetAgendaEventUseCase } from '../../../application/use-cases/get-agenda-event.use-case'

const event = { id: 'event-1', tenantId: 'tenant-1' } as AgendaEvent

function createDeps(overrides?: {
  findByTenantAndId?: AgendaEventRepository['findByTenantAndId']
}) {
  const agendaEventRepository: AgendaEventRepository = {
    create: vi.fn(),
    list: vi.fn(),
    findByTenantAndId: overrides?.findByTenantAndId ?? vi.fn().mockResolvedValue(event),
    update: vi.fn(),
    reschedule: vi.fn(),
    cancel: vi.fn(),
    hasOverlap: vi.fn(),
  }

  return { agendaEventRepository }
}

describe('GetAgendaEventUseCase', () => {
  it('retorna o evento quando encontrado no tenant', async () => {
    const deps = createDeps()
    const useCase = new GetAgendaEventUseCase(deps.agendaEventRepository)

    const result = await useCase.execute({ actorTenantId: 'tenant-1', id: 'event-1' })

    expect(result).toBe(event)
    expect(deps.agendaEventRepository.findByTenantAndId).toHaveBeenCalledWith('tenant-1', 'event-1')
  })

  it('lança AgendaEventNotFoundError quando o evento não existe no tenant', async () => {
    const deps = createDeps({ findByTenantAndId: vi.fn().mockResolvedValue(null) })
    const useCase = new GetAgendaEventUseCase(deps.agendaEventRepository)

    await expect(useCase.execute({ actorTenantId: 'tenant-1', id: 'inexistente' })).rejects.toThrow(
      AgendaEventNotFoundError,
    )
  })
})
