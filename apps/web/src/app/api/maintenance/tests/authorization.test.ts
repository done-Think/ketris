// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { requireMaintenanceActor } from '@server/maintenance/require-maintenance-actor'
import { maintenanceContainer } from '@server/maintenance/container'
import { GET as readMedia } from '../media/[...key]/route'
import { POST as performAction } from '../tickets/[id]/actions/route'
import { POST as linkUsers } from '../links/route'
import { GET as options } from '../options/route'
import type {
  MaintenanceActor,
  MaintenanceTicket,
} from '@server/maintenance/types/maintenance-ticket'

const s3Send = vi.hoisted(() => vi.fn())
vi.mock('@server/maintenance/require-maintenance-actor', () => ({
  requireMaintenanceActor: vi.fn(),
}))
vi.mock('@server/maintenance/container', () => ({
  maintenanceContainer: {
    repository: {
      findById: vi.fn(),
      findAttachmentTicket: vi.fn(),
      mutate: vi.fn(),
      linkUsers: vi.fn(),
      options: vi.fn(),
    },
  },
}))
vi.mock('@server/shared/storage/s3-client', () => ({
  getS3Client: () => ({ send: s3Send }),
  getUploadsBucketName: () => 'bucket',
}))
const actor: MaintenanceActor = {
  actorId: 'renter',
  actorTenantId: 'tenant',
  actorName: 'Renter',
  actorPapel: 'RENTER',
}
const ticket: MaintenanceTicket = {
  id: 'ticket',
  tenantId: 'tenant',
  propertyId: 'property',
  propertyTitle: 'Property',
  contractId: 'contract',
  responsibleId: null,
  responsibleName: null,
  provider: null,
  deletedAt: null,
  completedByRole: null,
  replacementRequests: [],
  title: 'Leak',
  description: 'Leak',
  category: 'Plumbing',
  priority: 'NORMAL',
  status: 'ABERTO',
  openedById: 'renter',
  openedByName: 'Renter',
  resolvedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  activities: [],
  attachments: [],
  access: { agentId: 'agent', ownerId: 'owner', renterIds: ['renter'], validContract: true },
}
function request(path: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/maintenance/${path}`, {
    method: body ? 'POST' : 'GET',
    ...(body
      ? { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }
      : {}),
  })
}
const context = { params: Promise.resolve({ id: 'ticket' }) }
describe('Maintenance API authorization and private media', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireMaintenanceActor).mockResolvedValue(actor)
    vi.mocked(maintenanceContainer.repository.findById).mockResolvedValue(ticket)
    vi.mocked(maintenanceContainer.repository.findAttachmentTicket).mockResolvedValue(ticket)
    s3Send.mockResolvedValue({
      Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) },
      ContentType: 'image/png',
    })
  })
  it('rejects missing contest reason and approval provider at the API boundary', async () => {
    expect(
      (
        await performAction(
          request('tickets/ticket/actions', { action: 'contest', reason: ' ' }),
          context,
        )
      ).status,
    ).toBe(400)
    expect(
      (
        await performAction(
          request('tickets/ticket/actions', { action: 'approveReplacement', requestId: 'r' }),
          context,
        )
      ).status,
    ).toBe(400)
    expect(maintenanceContainer.repository.mutate).not.toHaveBeenCalled()
  })
  it('refuses forged actor fields in a renter action', async () => {
    const response = await performAction(
      request('tickets/ticket/actions', {
        action: 'cancel',
        actorPapel: 'ADMIN',
        actorId: 'admin',
      }),
      context,
    )
    expect(response.status).toBe(403)
    expect(maintenanceContainer.repository.mutate).not.toHaveBeenCalled()
  })
  it('only admin may regularize links', async () => {
    expect(
      (await linkUsers(request('links', { contractId: 'contract', ownerId: 'owner' }))).status,
    ).toBe(403)
    expect(maintenanceContainer.repository.linkUsers).not.toHaveBeenCalled()
  })
  it('passes only the authenticated actor to options lookup', async () => {
    vi.mocked(maintenanceContainer.repository.options).mockResolvedValue({
      contracts: [],
      users: [],
    })
    expect((await options(request('options?tenantId=other'))).status).toBe(200)
    expect(maintenanceContainer.repository.options).toHaveBeenCalledWith(actor)
  })
  it('rejects foreign storage keys before contacting S3', async () => {
    const response = await readMedia(request('media/maintenance/other/file.png'), {
      params: Promise.resolve({ key: ['maintenance', 'other', 'file.png'] }),
    })
    expect(response.status).toBe(404)
    expect(s3Send).not.toHaveBeenCalled()
  })
  it('rejects keys for non-maintenance objects', async () => {
    expect(
      (
        await readMedia(request('media/profile/tenant/file.png'), {
          params: Promise.resolve({ key: ['profile', 'tenant', 'file.png'] }),
        })
      ).status,
    ).toBe(404)
    expect(s3Send).not.toHaveBeenCalled()
  })
  it('checks ticket membership even for a same-tenant storage key', async () => {
    vi.mocked(maintenanceContainer.repository.findAttachmentTicket).mockResolvedValue({
      ...ticket,
      access: { ...ticket.access, renterIds: [] },
    })
    const response = await readMedia(request('media/maintenance/tenant/file.png'), {
      params: Promise.resolve({ key: ['maintenance', 'tenant', 'file.png'] }),
    })
    expect(response.status).toBe(404)
    expect(s3Send).not.toHaveBeenCalled()
  })
  it('uses session-compatible auth for images and never public cache', async () => {
    const response = await readMedia(request('media/maintenance/tenant/file.png'), {
      params: Promise.resolve({ key: ['maintenance', 'tenant', 'file.png'] }),
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(requireMaintenanceActor).toHaveBeenCalledWith(expect.anything(), true)
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
  })
  it('blocks archive attachments for renter but permits admin audit', async () => {
    vi.mocked(maintenanceContainer.repository.findAttachmentTicket).mockResolvedValue({
      ...ticket,
      deletedAt: new Date(),
    })
    const mediaContext = { params: Promise.resolve({ key: ['maintenance', 'tenant', 'file.png'] }) }
    expect(
      (await readMedia(request('media/maintenance/tenant/file.png'), mediaContext)).status,
    ).toBe(404)
    vi.mocked(requireMaintenanceActor).mockResolvedValue({ ...actor, actorPapel: 'ADMIN' })
    expect(
      (await readMedia(request('media/maintenance/tenant/file.png'), mediaContext)).status,
    ).toBe(200)
  })
})
