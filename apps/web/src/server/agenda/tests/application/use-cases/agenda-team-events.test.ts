import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { User, UserRole } from '@server/auth/domain/user.entity'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import type { AgendaPropertyLookup } from '../../../application/ports/agenda-property-lookup.port'
import type { AgendaEvent } from '../../../domain/agenda-event.entity'
import type { AgendaEventRepository } from '../../../application/ports/agenda-event-repository.port'
import { CreateAgendaEventUseCase } from '../../../application/use-cases/create-agenda-event.use-case'
import { UpdateAgendaEventUseCase } from '../../../application/use-cases/update-agenda-event.use-case'
import { RescheduleAgendaEventUseCase } from '../../../application/use-cases/reschedule-agenda-event.use-case'
import { CancelAgendaEventUseCase } from '../../../application/use-cases/cancel-agenda-event.use-case'

const start = new Date('2026-10-21T10:00:00-03:00')
const input = {
  actorTenantId: 'agency',
  actorUserId: 'admin',
  actorRole: 'OWNER' as UserRole,
  title: 'Team meeting',
  start,
  durationMinutes: 60,
  internal: true,
  audience: 'ALL_AGENTS' as const,
  participantName: '',
  participantPhone: '',
}

function deps(changes: Partial<AgendaEvent> = {}) {
  const event: AgendaEvent = {
    id: 'event',
    tenantId: 'agency',
    responsibleId: 'admin',
    responsibleName: 'Agency',
    createdById: 'admin',
    ownerUserId: null,
    dono: null,
    participants: [],
    propertyId: null,
    freeFormPropertyReference: null,
    title: 'Team meeting',
    type: 'MEETING',
    audience: 'ALL_AGENTS',
    internal: true,
    status: 'CONFIRMED',
    start,
    end: new Date(start.getTime() + 3600000),
    participantName: '',
    participantPhone: '',
    notes: 'Discuss the weekly plan',
    createdAt: start,
    updatedAt: start,
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
    name: 'Agent',
    email: 'agent@example.test',
    passwordHash: '',
    role: 'AGENT',
    active: true,
    membershipApprovedAt: start,
  }
  const users = { findById: vi.fn().mockResolvedValue(agent) } as unknown as UserRepository
  const properties = { findByTenantAndId: vi.fn() } as unknown as AgendaPropertyLookup
  return { event, agent, repository, users, properties }
}

describe('Agency event recipients and internal events', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T06:00:00-03:00'))
  })
  afterEach(() => vi.useRealTimers())

  it('creates one collective event without property or client contact', async () => {
    const d = deps()
    await new CreateAgendaEventUseCase(d.repository, d.users, d.properties).execute(input)
    expect(d.repository.create).toHaveBeenCalledTimes(1)
    expect(d.repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        audience: 'ALL_AGENTS',
        internal: true,
        tenantId: 'agency',
        responsibleId: 'admin',
        propertyId: null,
        participantName: '',
        participantPhone: '',
      }),
      expect.anything(),
    )
    expect(d.users.findById).not.toHaveBeenCalled()
  })

  it('reuses the responsible field to direct an event to a validated agent', async () => {
    const d = deps()
    await new CreateAgendaEventUseCase(d.repository, d.users, d.properties).execute({
      ...input,
      audience: 'ASSIGNED_AGENT',
      responsibleId: 'agent',
    })
    expect(d.users.findById).toHaveBeenCalledWith('agent')
    expect(d.repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        audience: 'ASSIGNED_AGENT',
        responsibleId: 'agent',
        tenantId: 'agency',
      }),
      expect.anything(),
    )
  })

  it.each([
    { tenantId: 'other-tenant' },
    { active: false },
    { membershipApprovedAt: null },
    { role: 'OWNER' as UserRole },
    { role: 'RENTER' as UserRole },
  ])('rejects an unavailable agent: %j', async (changes) => {
    const d = deps()
    vi.mocked(d.users.findById).mockResolvedValue({ ...d.agent, ...changes })
    await expect(
      new CreateAgendaEventUseCase(d.repository, d.users, d.properties).execute({
        ...input,
        audience: 'ASSIGNED_AGENT',
        responsibleId: 'agent',
      }),
    ).rejects.toMatchObject({ status: 404 })
    expect(d.repository.create).not.toHaveBeenCalled()
  })

  it.each(['AGENT', 'PROPERTY_OWNER', 'RENTER'] as const)(
    'prevents %s from publishing internal or collective events',
    async (actorRole) => {
      const d = deps()
      await expect(
        new CreateAgendaEventUseCase(d.repository, d.users, d.properties).execute({
          ...input,
          actorRole,
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
        participantEmails: ['renter@example.test'],
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
        actorRole: 'OWNER',
        actorUserId: 'admin',
        id: 'event',
        audience: 'ASSIGNED_AGENT',
        responsibleId: 'other-agent',
        start: new Date('2026-10-22T11:00:00-03:00'),
      }),
    ).rejects.toMatchObject({ status: 404 })
    expect(d.repository.update).not.toHaveBeenCalled()
    expect(d.repository.reschedule).not.toHaveBeenCalled()
  })

  it('saves details, recipient and time in one update and clears internal links', async () => {
    const d = deps()
    const start = new Date('2026-10-22T11:00:00-03:00')
    await new UpdateAgendaEventUseCase(d.repository, d.properties, d.users).execute({
      actorTenantId: 'agency',
      actorRole: 'OWNER',
      actorUserId: 'admin',
      id: 'event',
      audience: 'ASSIGNED_AGENT',
      responsibleId: 'agent',
      start: start,
      title: 'Changed meeting',
    })
    expect(d.repository.update).toHaveBeenCalledTimes(1)
    expect(d.repository.update).toHaveBeenCalledWith(
      'agency',
      'event',
      expect.objectContaining({
        start: start,
        end: new Date(start.getTime() + 3600000),
        responsibleId: 'agent',
        audience: 'ASSIGNED_AGENT',
        title: 'Changed meeting',
      }),
      { ownerEmail: null, participantEmails: [] },
      'admin',
    )
    expect(d.repository.reschedule).not.toHaveBeenCalled()
  })

  it('keeps internal events read-only to agents across every mutation', async () => {
    const d = deps({ audience: 'ASSIGNED_AGENT', responsibleId: 'agent' })
    const actor = {
      actorTenantId: 'agency',
      actorRole: 'AGENT' as const,
      actorUserId: 'agent',
      id: 'event',
    }
    await expect(
      new UpdateAgendaEventUseCase(d.repository, d.properties, d.users).execute({
        ...actor,
        title: 'Changed',
      }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      new RescheduleAgendaEventUseCase(d.repository).execute({ ...actor, start }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      new CancelAgendaEventUseCase(d.repository).execute({
        ...actor,
        reason: 'Cliente indisponível',
      }),
    ).rejects.toMatchObject({
      status: 403,
    })
    expect(d.repository.update).not.toHaveBeenCalled()
    expect(d.repository.reschedule).not.toHaveBeenCalled()
    expect(d.repository.cancel).not.toHaveBeenCalled()
  })

  it('does not let an agent redirect or broaden an assigned client event', async () => {
    const d = deps({ internal: false, audience: 'ASSIGNED_AGENT', responsibleId: 'agent' })
    await expect(
      new UpdateAgendaEventUseCase(d.repository, d.properties, d.users).execute({
        actorTenantId: 'agency',
        actorRole: 'AGENT',
        actorUserId: 'agent',
        id: 'event',
        audience: 'SHARED_TEAM',
      }),
    ).rejects.toMatchObject({ status: 403 })
    expect(d.repository.update).not.toHaveBeenCalled()
  })
})
