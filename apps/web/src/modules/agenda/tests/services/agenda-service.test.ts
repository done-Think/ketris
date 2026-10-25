import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@shared/lib/api/http-client'

import { AgendaService } from '../../services/agenda-service'
import type { AgendaEventApi } from '../../types/agenda-event'

const event: AgendaEventApi = {
  audience: 'SHARED_TEAM',
  internal: false,
  responsibleName: 'Corretor',
  owner: null,
  createdBy: null,
  participants: [],
  propertyLabel: null,
  cancelledAt: null,
  cancelledById: null,
  cancellationReason: null,
  id: 'event-1',
  tenantId: 'tenant-1',
  responsibleId: 'user-1',
  createdById: 'user-1',
  propertyId: null,
  propertyReference: 'Sala comercial centro',
  title: 'Visita apartamento',
  kind: 'VISIT',
  status: 'CONFIRMED',
  start: '2026-10-05T13:00:00.000Z',
  end: '2026-10-05T14:00:00.000Z',
  participantName: 'Ana',
  participantPhone: '(11) 99999-0000',
  notes: null,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
}

describe('AgendaService', () => {
  const http = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
  let service: AgendaService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new AgendaService(http as unknown as HttpClient)
  })

  it('offers only active approved agents from the tenant-scoped user endpoint', async () => {
    http.get.mockResolvedValue({
      total: 4,
      page: 1,
      pageSize: 100,
      users: [
        { id: 'agent', name: 'Ana', role: 'AGENT', active: true, pendingApproval: false },
        { id: 'inactive', role: 'AGENT', active: false, pendingApproval: false },
        { id: 'pending', role: 'AGENT', active: true, pendingApproval: true },
        { id: 'owner', role: 'OWNER', active: true, pendingApproval: false },
      ],
    })
    expect(await service.listAgents()).toEqual([{ id: 'agent', name: 'Ana' }])
    expect(http.get).toHaveBeenCalledWith('/auth/users', { params: { page: 1, pageSize: 100 } })
  })

  it('loads every page of authorized charges and tickets instead of truncating the agenda', async () => {
    http.get
      .mockResolvedValueOnce({ items: [{ id: 'first' }], totalCount: 2 })
      .mockResolvedValueOnce({ items: [{ id: 'second' }], totalCount: 2 })
      .mockResolvedValueOnce({ items: [], totalCount: 0 })
    expect(await service.listCharges()).toEqual([{ id: 'first' }, { id: 'second' }])
    expect(http.get).toHaveBeenNthCalledWith(2, '/financial/charges', {
      params: { page: 2, pageSize: 100 },
    })
    expect(await service.listMaintenance()).toEqual([])
    expect(http.get).toHaveBeenLastCalledWith('/maintenance/tickets', {
      params: { page: 1, pageSize: 100 },
    })
  })

  it('lists events for a period and unwraps the response', async () => {
    http.get.mockResolvedValueOnce({ events: [event] })

    await expect(
      service.list('2026-10-01T00:00:00.000Z', '2026-10-31T00:00:00.000Z'),
    ).resolves.toEqual([event])
    expect(http.get).toHaveBeenCalledWith('/agenda/events', {
      params: { from: '2026-10-01T00:00:00.000Z', to: '2026-10-31T00:00:00.000Z' },
    })
  })

  it('creates an event and unwraps the response', async () => {
    http.post.mockResolvedValueOnce({ event })

    await expect(
      service.create({
        title: event.title,
        propertyReference: event.propertyReference ?? undefined,
        start: event.start,
        durationMinutes: 60,
        participantName: event.participantName,
        participantPhone: event.participantPhone,
      }),
    ).resolves.toEqual(event)
    expect(http.post).toHaveBeenCalledWith('/agenda/events', {
      title: event.title,
      propertyReference: event.propertyReference,
      start: event.start,
      durationMinutes: 60,
      participantName: event.participantName,
      participantPhone: event.participantPhone,
    })
  })

  it('updates an event and unwraps the response', async () => {
    http.patch.mockResolvedValueOnce({ event })

    await expect(
      service.update(event.id, { title: 'Visita remarcada', propertyId: 'prop-1' }),
    ).resolves.toEqual(event)
    expect(http.patch).toHaveBeenCalledWith(`/agenda/events/${event.id}`, {
      title: 'Visita remarcada',
      propertyId: 'prop-1',
    })
  })

  it('reschedules an event and unwraps the response', async () => {
    http.post.mockResolvedValueOnce({ event })

    await expect(
      service.reschedule(event.id, { start: '2026-10-06T13:00:00.000Z' }),
    ).resolves.toEqual(event)
    expect(http.post).toHaveBeenCalledWith(`/agenda/events/${event.id}/reschedule`, {
      start: '2026-10-06T13:00:00.000Z',
    })
  })

  it('cancels an event and unwraps the response', async () => {
    http.post.mockResolvedValueOnce({ event })

    await expect(service.cancel(event.id, { reason: 'Cliente indisponível' })).resolves.toEqual(
      event,
    )
    expect(http.post).toHaveBeenCalledWith(`/agenda/events/${event.id}/cancel`, {
      reason: 'Cliente indisponível',
    })
  })
})

it('carrega corretores aprovados das páginas seguintes, mantendo a filtragem dos inativos', async () => {
  const get = vi
    .fn()
    .mockResolvedValueOnce({
      users: [{ id: 'inactive', role: 'AGENT', active: false, pendingApproval: false }],
      total: 2,
      page: 1,
      pageSize: 1,
    })
    .mockResolvedValueOnce({
      users: [
        { id: 'agent-2', name: 'Bruna', role: 'AGENT', active: true, pendingApproval: false },
      ],
      total: 2,
      page: 2,
      pageSize: 1,
    })
  const service = new AgendaService({ get } as unknown as HttpClient)
  expect(await service.listAgents()).toEqual([{ id: 'agent-2', name: 'Bruna' }])
  expect(get).toHaveBeenNthCalledWith(2, '/auth/users', { params: { page: 2, pageSize: 100 } })
})
