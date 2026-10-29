import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import { describe, expect, it, vi } from 'vitest'

import { AgendaPropertyNotFoundError } from '../../../domain/errors'
import type { Property } from '@server/properties/types/property'
import type { AgendaPropertyLookup } from '../../../application/ports/agenda-property-lookup.port'

import { AgendaEventNotFoundError, AgendaVisitMinimumDurationError } from '../../../domain/errors'
import type { AgendaEvent } from '../../../domain/agenda-event.entity'
import type { AgendaEventLinks } from '../../../types/agenda-event'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { UpdateAgendaEventUseCase } from '../../../application/use-cases/update-agenda-event.use-case'

const updatedEvent = { id: 'event-1', title: 'Atualizado' } as AgendaEvent

const shortEvent: AgendaEvent = {
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
  title: 'Follow-up rápido',
  type: 'FOLLOW_UP',
  status: 'CONFIRMED',
  start: new Date('2026-10-01T13:00:00.000Z'),
  end: new Date('2026-10-01T13:15:00.000Z'),
  participantName: 'Ana',
  participantPhone: '11999990000',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function createDeps(overrides?: {
  update?: AgendaEventRepository['update']
  findAccessibleProperty?: AgendaPropertyLookup['findAccessibleProperty']
  agendaFindByTenantAndId?: AgendaEventRepository['findByTenantAndId']
}) {
  const agendaEventRepository: AgendaEventRepository = {
    create: vi.fn(),
    list: vi.fn(),
    findByScopeAndId: vi.fn(),
    findByTenantAndId: overrides?.agendaFindByTenantAndId ?? vi.fn().mockResolvedValue(shortEvent),
    update: overrides?.update ?? vi.fn().mockResolvedValue(updatedEvent),
    reschedule: vi.fn(),
    cancel: vi.fn(),
    hasOverlap: vi.fn(),
  }
  const propertyRepository: AgendaPropertyLookup = {
    findAccessibleProperty:
      overrides?.findAccessibleProperty ??
      vi.fn().mockResolvedValue({ id: 'property-1' } as Property),
    findRentedProperty: vi.fn(),
  }

  return {
    agendaEventRepository,
    propertyRepository,
    userRepository: { findById: vi.fn() } as unknown as UserRepository,
  }
}

describe('UpdateAgendaEventUseCase', () => {
  it('atualiza o evento com os campos informados', async () => {
    const deps = createDeps()
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
      deps.userRepository,
    )

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'AGENT',
      id: 'event-1',
      title: 'Atualizado',
    })

    expect(result).toBe(updatedEvent)
    expect(deps.agendaEventRepository.update).toHaveBeenCalledWith(
      'tenant-1',
      'event-1',
      expect.objectContaining({ title: 'Atualizado' }),
      { ownerEmail: undefined, participantEmails: undefined },
      undefined,
    )
  })

  it('o RENTER não edita evento criado por outra pessoa', async () => {
    const deps = createDeps()
    vi.mocked(deps.agendaEventRepository.findByScopeAndId).mockResolvedValue({
      id: 'event-1',
      tenantId: 'agency-1',
      responsibleId: 'agent-1',
      createdById: 'agent-1',
    } as AgendaEvent)
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
      deps.userRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'renters',
        actorUserId: 'renter-1',
        actorRole: 'RENTER',
        id: 'event-1',
        title: 'X',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.agendaEventRepository.update).not.toHaveBeenCalled()
  })

  it('lança AgendaPropertyNotFoundError quando o novo imovelId não existe no tenant', async () => {
    const deps = createDeps({ findAccessibleProperty: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
      deps.userRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorRole: 'AGENT',
        id: 'event-1',
        propertyId: 'inexistente',
      }),
    ).rejects.toThrow(AgendaPropertyNotFoundError)
  })

  it('lança AgendaEventNotFoundError quando o evento não existe no tenant', async () => {
    const deps = createDeps({ update: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
      deps.userRepository,
    )

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorRole: 'AGENT', id: 'inexistente' }),
    ).rejects.toThrow(AgendaEventNotFoundError)
  })

  it('lança AgendaVisitMinimumDurationError ao marcar como VISIT um evento com menos de 30min', async () => {
    const deps = createDeps()
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
      deps.userRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorRole: 'AGENT',
        id: 'event-1',
        type: 'VISIT',
      }),
    ).rejects.toThrow(AgendaVisitMinimumDurationError)
    expect(deps.agendaEventRepository.update).not.toHaveBeenCalled()
  })

  it('permite marcar como VISIT um evento que já dura 30min ou mais', async () => {
    const longEvent = {
      ...shortEvent,
      end: new Date('2026-10-01T13:30:00.000Z'),
    }
    const deps = createDeps({ agendaFindByTenantAndId: vi.fn().mockResolvedValue(longEvent) })
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
      deps.userRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'AGENT',
      id: 'event-1',
      type: 'VISIT',
    })

    expect(deps.agendaEventRepository.update).toHaveBeenCalled()
  })

  const linkEditCases: [string, AgendaEventLinks, AgendaEventLinks][] = [
    [
      'omitidos mantêm dono e participantes',
      {},
      { ownerEmail: undefined, participantEmails: undefined },
    ],
    [
      'null remove o dono e [] remove os participantes',
      { ownerEmail: null, participantEmails: [] },
      { ownerEmail: null, participantEmails: [] },
    ],
    [
      'e-mails trocam o dono e substituem os participantes',
      { ownerEmail: 'Novo@Ketris.dev', participantEmails: ['a@ketris.dev', 'A@ketris.dev'] },
      { ownerEmail: 'novo@ketris.dev', participantEmails: ['a@ketris.dev'] },
    ],
  ]

  it.each(linkEditCases)(
    'repassa a semântica de edição dos vínculos: %s',
    async (_, links, expected) => {
      const deps = createDeps()
      const useCase = new UpdateAgendaEventUseCase(
        deps.agendaEventRepository,
        deps.propertyRepository,
        deps.userRepository,
      )

      await useCase.execute({
        actorTenantId: 'tenant-1',
        actorRole: 'AGENT',
        id: 'event-1',
        title: 'Atualizado',
        ...links,
      })

      expect(deps.agendaEventRepository.update).toHaveBeenCalledWith(
        'tenant-1',
        'event-1',
        expect.objectContaining({ title: 'Atualizado' }),
        expected,
        undefined,
      )
    },
  )
})
