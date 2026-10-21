import { describe, expect, it, vi } from 'vitest'

import type { AgendaEvent } from '../../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { ListAgendaEventsUseCase } from '../../../application/use-cases/list-agenda-events.use-case'

const events: AgendaEvent[] = []
const from = new Date('2026-10-01T00:00:00.000Z')
const to = new Date('2026-10-08T00:00:00.000Z')

function createDeps() {
  const agendaEventRepository: AgendaEventRepository = {
    create: vi.fn(),
    list: vi.fn().mockResolvedValue(events),
    findByScopeAndId: vi.fn(),
    findByTenantAndId: vi.fn(),
    update: vi.fn(),
    reschedule: vi.fn(),
    cancel: vi.fn(),
    hasOverlap: vi.fn(),
  }

  return { agendaEventRepository }
}

describe('ListAgendaEventsUseCase', () => {
  it('repassa o escopo do tenant, período e responsibleId pro repositório', async () => {
    const deps = createDeps()
    const useCase = new ListAgendaEventsUseCase(deps.agendaEventRepository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorUserId: 'agent-1',
      actorPapel: 'AGENT',
      from,
      to,
      responsavelId: 'agent-1',
    })

    expect(deps.agendaEventRepository.list).toHaveBeenCalledWith({
      scope: { kind: 'agent', tenantId: 'tenant-1', userId: 'agent-1' },
      from,
      to,
      responsavelId: 'agent-1',
    })
  })

  it.each(['ADMIN', 'OWNER', 'AGENT'] as const)(
    'repassa o escopo de leitura do perfil %s',
    async (papel) => {
      const deps = createDeps()
      const useCase = new ListAgendaEventsUseCase(deps.agendaEventRepository)

      const result = await useCase.execute({
        actorTenantId: 'tenant-1',
        actorUserId: 'user-1',
        actorPapel: papel,
        from,
        to,
      })

      expect(result).toBe(events)
      expect(deps.agendaEventRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({
          scope:
            papel === 'ADMIN'
              ? { kind: 'tenant', tenantId: 'tenant-1' }
              : {
                  kind: papel === 'AGENT' ? 'agent' : 'owner',
                  tenantId: 'tenant-1',
                  userId: 'user-1',
                },
        }),
      )
    },
  )

  it('lista para RENTER só pelo vínculo com o próprio usuário, combinado com os filtros', async () => {
    const deps = createDeps()
    const useCase = new ListAgendaEventsUseCase(deps.agendaEventRepository)

    const result = await useCase.execute({
      actorTenantId: 'renters-tenant',
      actorUserId: 'renter-1',
      actorPapel: 'RENTER',
      from,
      to,
      responsavelId: 'agent-1',
    })

    expect(result).toBe(events)
    expect(deps.agendaEventRepository.list).toHaveBeenCalledWith({
      scope: { kind: 'linkedUser', userId: 'renter-1' },
      from,
      to,
      responsavelId: 'agent-1',
    })
  })
})
