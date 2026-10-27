// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { JoseMaintenanceUploadTickets } from '../../infrastructure/jose-maintenance-upload-tickets'

const descriptor = {
  uploadId: '00000000-0000-4000-8000-000000000001',
  actorId: 'u1',
  tenantId: 'agency',
  ticketId: 'ticket',
  filename: 'image.png',
  contentType: 'image/png',
  size: 123,
  sha256: 'a'.repeat(64),
}
describe('Maintenance signed upload grants', () => {
  beforeEach(() => vi.stubEnv('AUTH_TOKEN_SECRET', 'maintenance-unit-secret'))
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })
  it('round-trips all immutable upload claims and rejects tampering', async () => {
    const service = new JoseMaintenanceUploadTickets()
    const token = await service.issue(descriptor)
    expect(await service.verify(token)).toEqual(descriptor)
    const parts = token.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    payload.descriptor.actorId = 'another-user'
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url')
    await expect(service.verify(parts.join('.'))).rejects.toMatchObject({
      code: 'MAINTENANCE_UPLOAD_INVALID',
    })
  })
  it('expires the grant after ten minutes', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-26T10:00:00Z'))
    const service = new JoseMaintenanceUploadTickets()
    const token = await service.issue(descriptor)
    vi.setSystemTime(new Date('2026-10-26T10:10:01Z'))
    await expect(service.verify(token)).rejects.toMatchObject({
      code: 'MAINTENANCE_UPLOAD_EXPIRED',
    })
  })
  it('does not accept a grant signed by another secret', async () => {
    const service = new JoseMaintenanceUploadTickets()
    const token = await service.issue(descriptor)
    vi.stubEnv('AUTH_TOKEN_SECRET', 'different-secret')
    await expect(service.verify(token)).rejects.toMatchObject({
      code: 'MAINTENANCE_UPLOAD_INVALID',
    })
  })
})
