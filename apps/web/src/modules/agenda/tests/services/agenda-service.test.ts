import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@shared/lib/api/http-client'

import { AgendaService } from '../../services/agenda-service'
import type { AgendaEventApi } from '../../types/agenda-event'

const event: AgendaEventApi = {
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

    await expect(service.cancel(event.id)).resolves.toEqual(event)
    expect(http.post).toHaveBeenCalledWith(`/agenda/events/${event.id}/cancel`)
  })
})
