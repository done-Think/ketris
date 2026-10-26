// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@shared/lib/api/http-client'

import { MaintenanceService } from '../../services/maintenance-service'
import type { ApiMaintenanceTicket } from '../../types/service'

function mockClient() {
  return { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() }
}

const ticket = { id: 'ticket-1' } as ApiMaintenanceTicket
let http: ReturnType<typeof mockClient>
let service: MaintenanceService

beforeEach(() => {
  http = mockClient()
  service = new MaintenanceService(http as unknown as HttpClient)
})

describe('MaintenanceService', () => {
  it('lists tickets sending only the filled filters, category included', async () => {
    http.get.mockResolvedValue({ items: [], totalCount: 0 })
    await service.list({ category: 'ELECTRICAL', search: '', page: 2, archived: false })
    expect(http.get).toHaveBeenCalledWith('/maintenance/tickets', {
      params: { category: 'ELECTRICAL', page: '2' },
    })
  })

  it('unwraps the ticket from detail, mutation and action responses', async () => {
    http.get.mockResolvedValue({ ticket })
    http.post.mockResolvedValue({ ticket })
    http.patch.mockResolvedValue({ ticket })

    await expect(service.get('ticket-1')).resolves.toBe(ticket)
    await expect(service.update('ticket-1', { title: 'Novo' })).resolves.toBe(ticket)
    await expect(service.resolve('ticket-1')).resolves.toBe(ticket)
    await expect(service.act('ticket-1', { action: 'start' })).resolves.toBe(ticket)
    expect(http.post).toHaveBeenCalledWith('/maintenance/tickets/ticket-1/actions', {
      action: 'start',
    })
  })

  it('sends notes, attachments and user links to their routes', async () => {
    http.post
      .mockResolvedValueOnce({ activity: { id: 'a1' } })
      .mockResolvedValueOnce({ attachment: { id: 'f1' } })
      .mockResolvedValueOnce(undefined)
    http.get.mockResolvedValue({ activities: [{ id: 'a1' }] })

    await expect(service.addNote('ticket-1', 'Olá')).resolves.toEqual({ id: 'a1' })
    await expect(
      service.uploadAttachment('ticket-1', new File(['x'], 'foto.png', { type: 'image/png' })),
    ).resolves.toEqual({ id: 'f1' })
    await service.linkUsers({ contractId: 'c1', ownerId: 'o1' })
    await expect(service.listActivities('ticket-1')).resolves.toEqual([{ id: 'a1' }])

    expect(http.post).toHaveBeenNthCalledWith(1, '/maintenance/tickets/ticket-1/notes', {
      message: 'Olá',
    })
    expect(http.post.mock.calls[1][1]).toBeInstanceOf(FormData)
    expect(http.post).toHaveBeenNthCalledWith(3, '/maintenance/links', {
      contractId: 'c1',
      ownerId: 'o1',
    })
  })
})
