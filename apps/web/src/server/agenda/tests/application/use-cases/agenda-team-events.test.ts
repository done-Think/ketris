import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { User, Papel } from '@server/auth/domain/user.entity'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import type { PropertyRepository } from '@server/properties/application/ports/property-repository.port'
import type { AgendaEvent } from '../../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { CreateAgendaEventUseCase } from '../../../application/use-cases/create-agenda-event.use-case'
import { UpdateAgendaEventUseCase } from '../../../application/use-cases/update-agenda-event.use-case'
import { RescheduleAgendaEventUseCase } from '../../../application/use-cases/reschedule-agenda-event.use-case'
import { CancelAgendaEventUseCase } from '../../../application/use-cases/cancel-agenda-event.use-case'

const inicio = new Date(2026, 9, 21, 10)
const input = {
  actorTenantId: 'agency',
  actorUserId: 'admin',
  actorPapel: 'ADMIN' as Papel,
  titulo: 'Team meeting',
  inicio,
  durationMinutes: 60,
  interno: true,
  destino: 'ALL_AGENTS' as const,
  participanteNome: '',
  participanteTelefone: '',
}

function deps(changes: Partial<AgendaEvent> = {}) {
  const event: AgendaEvent = {
    id: 'event',
    tenantId: 'agency',
    responsavelId: 'admin',
    responsavelNome: 'Agency',
    criadoPorId: 'admin',
    donoUsuarioId: null,
    dono: null,
    participantes: [],
    imovelId: null,
    referenciaImovelLivre: null,
    titulo: 'Team meeting',
    tipo: 'MEETING',
    destino: 'ALL_AGENTS',
    interno: true,
    status: 'CONFIRMED',
    inicio,
    fim: new Date(inicio.getTime() + 3600000),
    participanteNome: '',
    participanteTelefone: '',
    notas: 'Discuss the weekly plan',
    createdAt: inicio,
    updatedAt: inicio,
    ...changes,
  }
  const repository: AgendaEventRepository = {
    create: vi.fn().mockResolvedValue(event),
    update: vi.fn().mockResolvedValue(event),
    list: vi.fn(),
    findByTenantAndId: vi.fn().mockResolvedValue(event),
    findByScopeAndId: vi.fn(),
    reschedule: vi.fn().mockResolvedValue(event),
    cancel: vi.fn().mockResolvedValue(event),
    hasOverlap: vi.fn().mockResolvedValue(false),
  }
  const agent: User = {
    id: 'agent',
    tenantId: 'agency',
    nome: 'Agent',
    email: 'agent@example.test',
    senhaHash: '',
    papel: 'AGENT',
    ativo: true,
    vinculoAprovadoEm: inicio,
  }
  const users = { findById: vi.fn().mockResolvedValue(agent) } as unknown as UserRepository
  const properties = { findByTenantAndId: vi.fn() } as unknown as PropertyRepository
  return { event, agent, repository, users, properties }
}

describe('Agency event recipients and internal events', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 20, 6))
  })
  afterEach(() => vi.useRealTimers())

  it('creates one collective event without property or client contact', async () => {
    const d = deps()
    await new CreateAgendaEventUseCase(d.repository, d.users, d.properties).execute(input)
    expect(d.repository.create).toHaveBeenCalledTimes(1)
    expect(d.repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        destino: 'ALL_AGENTS',
        interno: true,
        tenantId: 'agency',
        responsavelId: 'admin',
        imovelId: null,
        participanteNome: '',
        participanteTelefone: '',
      }),
      expect.anything(),
    )
    expect(d.users.findById).not.toHaveBeenCalled()
  })

  it('reuses the responsible field to direct an event to a validated agent', async () => {
    const d = deps()
    await new CreateAgendaEventUseCase(d.repository, d.users, d.properties).execute({
      ...input,
      destino: 'ASSIGNED_AGENT',
      responsavelId: 'agent',
    })
    expect(d.users.findById).toHaveBeenCalledWith('agent')
    expect(d.repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        destino: 'ASSIGNED_AGENT',
        responsavelId: 'agent',
        tenantId: 'agency',
      }),
      expect.anything(),
    )
  })

  it.each([
    { tenantId: 'other-tenant' },
    { ativo: false },
    { vinculoAprovadoEm: null },
    { papel: 'OWNER' as Papel },
    { papel: 'RENTER' as Papel },
  ])('rejects an unavailable agent: %j', async (changes) => {
    const d = deps()
    vi.mocked(d.users.findById).mockResolvedValue({ ...d.agent, ...changes })
    await expect(
      new CreateAgendaEventUseCase(d.repository, d.users, d.properties).execute({
        ...input,
        destino: 'ASSIGNED_AGENT',
        responsavelId: 'agent',
      }),
    ).rejects.toMatchObject({ status: 404 })
    expect(d.repository.create).not.toHaveBeenCalled()
  })

  it.each(['AGENT', 'OWNER', 'RENTER'] as const)(
    'prevents %s from publishing internal or collective events',
    async (actorPapel) => {
      const d = deps()
      await expect(
        new CreateAgendaEventUseCase(d.repository, d.users, d.properties).execute({
          ...input,
          actorPapel,
        }),
      ).rejects.toMatchObject({ status: 403 })
      expect(d.repository.create).not.toHaveBeenCalled()
    },
  )

  it('rejects external links in an internal event', async () => {
    const d = deps()
    await expect(
      new CreateAgendaEventUseCase(d.repository, d.users, d.properties).execute({
        ...input,
        participanteEmails: ['renter@example.test'],
      }),
    ).rejects.toMatchObject({ status: 409 })
    expect(d.repository.create).not.toHaveBeenCalled()
  })

  it('validates the new agent before saving either schedule or recipient', async () => {
    const d = deps()
    vi.mocked(d.users.findById).mockResolvedValue(null)
    await expect(
      new UpdateAgendaEventUseCase(d.repository, d.properties, d.users).execute({
        actorTenantId: 'agency',
        actorPapel: 'ADMIN',
        actorUserId: 'admin',
        id: 'event',
        destino: 'ASSIGNED_AGENT',
        responsavelId: 'other-agent',
        inicio: new Date(2026, 9, 22, 11),
      }),
    ).rejects.toMatchObject({ status: 404 })
    expect(d.repository.update).not.toHaveBeenCalled()
    expect(d.repository.reschedule).not.toHaveBeenCalled()
  })

  it('saves details, recipient and time in one update and clears internal links', async () => {
    const d = deps()
    const start = new Date(2026, 9, 22, 11)
    await new UpdateAgendaEventUseCase(d.repository, d.properties, d.users).execute({
      actorTenantId: 'agency',
      actorPapel: 'ADMIN',
      actorUserId: 'admin',
      id: 'event',
      destino: 'ASSIGNED_AGENT',
      responsavelId: 'agent',
      inicio: start,
      titulo: 'Changed meeting',
    })
    expect(d.repository.update).toHaveBeenCalledTimes(1)
    expect(d.repository.update).toHaveBeenCalledWith(
      'agency',
      'event',
      expect.objectContaining({
        inicio: start,
        fim: new Date(start.getTime() + 3600000),
        responsavelId: 'agent',
        destino: 'ASSIGNED_AGENT',
        titulo: 'Changed meeting',
      }),
      { donoEmail: null, participanteEmails: [] },
    )
    expect(d.repository.reschedule).not.toHaveBeenCalled()
  })

  it('keeps internal events read-only to agents across every mutation', async () => {
    const d = deps({ destino: 'ASSIGNED_AGENT', responsavelId: 'agent' })
    const actor = {
      actorTenantId: 'agency',
      actorPapel: 'AGENT' as const,
      actorUserId: 'agent',
      id: 'event',
    }
    await expect(
      new UpdateAgendaEventUseCase(d.repository, d.properties, d.users).execute({
        ...actor,
        titulo: 'Changed',
      }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      new RescheduleAgendaEventUseCase(d.repository).execute({ ...actor, inicio }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(new CancelAgendaEventUseCase(d.repository).execute(actor)).rejects.toMatchObject({
      status: 403,
    })
    expect(d.repository.update).not.toHaveBeenCalled()
    expect(d.repository.reschedule).not.toHaveBeenCalled()
    expect(d.repository.cancel).not.toHaveBeenCalled()
  })

  it('does not let an agent redirect or broaden an assigned client event', async () => {
    const d = deps({ interno: false, destino: 'ASSIGNED_AGENT', responsavelId: 'agent' })
    await expect(
      new UpdateAgendaEventUseCase(d.repository, d.properties, d.users).execute({
        actorTenantId: 'agency',
        actorPapel: 'AGENT',
        actorUserId: 'agent',
        id: 'event',
        destino: 'LEGACY_TEAM',
      }),
    ).rejects.toMatchObject({ status: 403 })
    expect(d.repository.update).not.toHaveBeenCalled()
  })
})
