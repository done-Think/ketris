import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@server/maintenance/infrastructure/s3-maintenance-attachment-storage', async () => {
  const storage = await import('../fixtures/maintenance-storage')
  return {
    S3MaintenanceAttachmentStorage: class {
      upload = storage.uploadToStorage
      download = storage.downloadFromStorage
      uploadLocation = storage.prepareStorageUpload
      inspect = storage.inspectStorageUpload
    },
  }
})

import { prisma } from '@server/db/prisma'
import { GET as read } from '../../media/[...key]/route'
import { POST as complete } from '../../tickets/[id]/attachments/complete/route'
import { POST as prepare } from '../../tickets/[id]/attachments/upload/route'
import { setupMaintenanceIntegration } from '../fixtures/maintenance-api'
import {
  downloadFromStorage,
  inspectStorageUpload,
  prepareStorageUpload,
} from '../fixtures/maintenance-storage'

describe('/api/maintenance direct private uploads', () => {
  const env = setupMaintenanceIntegration()
  const { create, context, request } = env
  const metadata = {
    filename: 'large-repair.png',
    size: 8 * 1024 * 1024,
    contentType: 'image/png',
    sha256: 'ab'.repeat(32),
  }
  beforeEach(() => {
    prepareStorageUpload.mockReset().mockResolvedValue({
      url: 'https://private-storage.example.test/upload',
      headers: { 'Content-Type': 'image/png' },
    })
    inspectStorageUpload.mockReset().mockResolvedValue(metadata)
    downloadFromStorage.mockClear()
  })

  async function grant(id: string, token = env.fixture.renter.token) {
    const response = await prepare(
      request(`tickets/${id}/attachments/upload`, 'POST', token, metadata),
      context(id),
    )
    expect(response.status).toBe(200)
    return response.json() as Promise<{ token: string }>
  }
  async function finish(id: string, token: string, actor = env.fixture.renter.token) {
    return complete(
      request(`tickets/${id}/attachments/complete`, 'POST', actor, { token }),
      context(id),
    )
  }
  it('accepts 8 MB, completes once on replay, and authorizes private redirects by ticket', async () => {
    const id = await create()
    const { token } = await grant(id)
    const response = await finish(id, token)
    expect(response.status).toBe(201)
    const { attachment } = await response.json()
    expect((await (await finish(id, token)).json()).attachment.id).toBe(attachment.id)
    expect(await prisma.maintenanceTicketAttachment.count({ where: { ticketId: id } })).toBe(1)
    expect(
      await prisma.maintenanceTicketActivity.count({
        where: { ticketId: id, type: 'ATTACHMENT_ADDED' },
      }),
    ).toBe(1)
    const key = attachment.url.slice('/api/maintenance/media/'.length).split('/')
    const routeContext = { params: Promise.resolve({ key }) }
    const allowed = await read(
      request(`media/${key.join('/')}`, 'GET', env.fixture.renter.token),
      routeContext,
    )
    expect(allowed.status).toBe(302)
    expect(allowed.headers.get('location')).toBe(
      'https://private-storage.example.test/temporary-image',
    )
    expect(allowed.headers.get('cache-control')).toBe('private, no-store')
    const denied = await read(
      request(`media/${key.join('/')}`, 'GET', env.fixture.unrelated.token),
      routeContext,
    )
    expect(denied.status).toBe(404)
    expect(downloadFromStorage).toHaveBeenCalledTimes(1)
  })
  it('rejects oversize, unexpected fields and ineligible users before signing', async () => {
    const id = await create()
    for (const invalid of [
      { ...metadata, size: metadata.size + 1 },
      { ...metadata, tenantId: env.other.tenant.id },
    ]) {
      expect(
        (
          await prepare(
            request(`tickets/${id}/attachments/upload`, 'POST', env.fixture.renter.token, invalid),
            context(id),
          )
        ).status,
      ).toBe(400)
    }
    expect(
      (
        await prepare(
          request(
            `tickets/${id}/attachments/upload`,
            'POST',
            env.fixture.unrelated.token,
            metadata,
          ),
          context(id),
        )
      ).status,
    ).toBe(404)
    expect(prepareStorageUpload).not.toHaveBeenCalled()
  })
  it('binds the grant to the actor and ticket and rejects tampering', async () => {
    const id = await create(),
      otherId = await create()
    const { token } = await grant(id)
    expect((await finish(id, token, env.fixture.admin.token)).status).toBe(404)
    expect((await finish(otherId, token)).status).toBe(404)
    const tampered = token.slice(0, token.lastIndexOf('.') + 1) + 'invalid'
    expect((await finish(id, tampered)).status).toBe(400)
    expect(inspectStorageUpload).not.toHaveBeenCalled()
  })
  it.each(['size', 'contentType', 'sha256'] as const)(
    'rejects mismatching stored %s',
    async (field) => {
      const id = await create()
      const { token } = await grant(id)
      inspectStorageUpload.mockResolvedValueOnce({
        ...metadata,
        [field]: field === 'size' ? 1 : 'different',
      })
      expect((await finish(id, token)).status).toBe(400)
      expect(await prisma.maintenanceTicketAttachment.count({ where: { ticketId: id } })).toBe(0)
    },
  )
  it('revalidates collaboration before completion after the ticket closes', async () => {
    const id = await create()
    const { token } = await grant(id)
    await prisma.maintenanceTicket.update({ where: { id }, data: { status: 'CANCELED' } })
    expect((await finish(id, token)).status).toBe(409)
    expect(inspectStorageUpload).not.toHaveBeenCalled()
  })
})
