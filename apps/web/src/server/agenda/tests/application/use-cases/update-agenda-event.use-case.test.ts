import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import { describe, expect, it, vi } from 'vitest'

import { PropertyNotFoundError } from '@server/properties/domain/errors'
import type { Property } from '@server/properties/types/property'
import type { PropertyRepository } from '@server/properties/application/ports/property-repository.port'

import { AgendaEventNotFoundError, AgendaVisitMinimumDurationError } from '../../../domain/errors'
import type { AgendaEvent, AgendaEventLinks } from '../../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { UpdateAgendaEventUseCase } from '../../../application/use-cases/update-agenda-event.use-case'

const updatedEvent = { id: 'event-1', titulo: 'Atualizado' } as AgendaEvent

const shortEvent: AgendaEvent = {
  id: 'event-1',
  tenantId: 'tenant-1',
  responsavelId: 'agent-1',
  criadoPorId: 'agent-1',
  responsavelNome: 'Corretor',
  donoUsuarioId: null,
  dono: null,
  participantes: [],
  imovelId: null,
  referenciaImovelLivre: null,
  titulo: 'Follow-up rápido',
  tipo: 'FOLLOW_UP',
  status: 'CONFIRMED',
  inicio: new Date('2026-10-01T13:00:00.000Z'),
  fim: new Date('2026-10-01T13:15:00.000Z'),
  participanteNome: 'Ana',
  participanteTelefone: '11999990000',
  notas: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function createDeps(overrides?: {
  update?: AgendaEventRepository['update']
  findByTenantAndId?: PropertyRepository['findByTenantAndId']
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
  const propertyRepository: PropertyRepository = {
    create: vi.fn(),
    list: vi.fn(),
    findByTenantAndId:
      overrides?.findByTenantAndId ?? vi.fn().mockResolvedValue({ id: 'property-1' } as Property),
    update: vi.fn(),
    setStatus: vi.fn(),
    findContractProperty: vi.fn(),
    hasLinkedRecords: vi.fn(),
    delete: vi.fn(),
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
      actorPapel: 'AGENT',
      id: 'event-1',
      titulo: 'Atualizado',
    })

    expect(result).toBe(updatedEvent)
    expect(deps.agendaEventRepository.update).toHaveBeenCalledWith(
      'tenant-1',
      'event-1',
      expect.objectContaining({ titulo: 'Atualizado' }),
      { donoEmail: undefined, participanteEmails: undefined },
    )
  })

  it('lança ForbiddenError quando o ator é RENTER', async () => {
    const deps = createDeps()
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
      deps.userRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'RENTER',
        id: 'event-1',
        titulo: 'X',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(deps.agendaEventRepository.update).not.toHaveBeenCalled()
  })

  it('lança PropertyNotFoundError quando o novo imovelId não existe no tenant', async () => {
    const deps = createDeps({ findByTenantAndId: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
      deps.userRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'AGENT',
        id: 'event-1',
        imovelId: 'inexistente',
      }),
    ).rejects.toThrow(PropertyNotFoundError)
  })

  it('lança AgendaEventNotFoundError quando o evento não existe no tenant', async () => {
    const deps = createDeps({ update: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
      deps.userRepository,
    )

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'AGENT', id: 'inexistente' }),
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
        actorPapel: 'AGENT',
        id: 'event-1',
        tipo: 'VISIT',
      }),
    ).rejects.toThrow(AgendaVisitMinimumDurationError)
    expect(deps.agendaEventRepository.update).not.toHaveBeenCalled()
  })

  it('permite marcar como VISIT um evento que já dura 30min ou mais', async () => {
    const longEvent = {
      ...shortEvent,
      fim: new Date('2026-10-01T13:30:00.000Z'),
    }
    const deps = createDeps({ agendaFindByTenantAndId: vi.fn().mockResolvedValue(longEvent) })
    const useCase = new UpdateAgendaEventUseCase(
      deps.agendaEventRepository,
      deps.propertyRepository,
      deps.userRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'AGENT',
      id: 'event-1',
      tipo: 'VISIT',
    })

    expect(deps.agendaEventRepository.update).toHaveBeenCalled()
  })

  const linkEditCases: [string, AgendaEventLinks, AgendaEventLinks][] = [
    [
      'omitidos mantêm dono e participantes',
      {},
      { donoEmail: undefined, participanteEmails: undefined },
    ],
    [
      'null remove o dono e [] remove os participantes',
      { donoEmail: null, participanteEmails: [] },
      { donoEmail: null, participanteEmails: [] },
    ],
    [
      'e-mails trocam o dono e substituem os participantes',
      { donoEmail: 'Novo@Ketris.dev', participanteEmails: ['a@ketris.dev', 'A@ketris.dev'] },
      { donoEmail: 'novo@ketris.dev', participanteEmails: ['a@ketris.dev'] },
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
        actorPapel: 'AGENT',
        id: 'event-1',
        titulo: 'Atualizado',
        ...links,
      })

      expect(deps.agendaEventRepository.update).toHaveBeenCalledWith(
        'tenant-1',
        'event-1',
        expect.objectContaining({ titulo: 'Atualizado' }),
        expected,
      )
    },
  )
})
