import { describe, expect, it } from 'vitest'
import {
  MaintenanceAttachmentValidationError,
  MaintenanceTicketNotFoundError,
} from '../../domain/errors'
import {
  assertValidMaintenanceAttachment,
  resolveMaintenanceMediaObject,
} from '../../domain/maintenance-attachment-rules'
import { admin, renter } from '../fixtures/maintenance-ticket'

describe('Maintenance attachment rules (domain)', () => {
  it('accepts images up to 8 MiB and rejects anything else', () => {
    expect(() => assertValidMaintenanceAttachment(8 * 1024 * 1024, 'image/webp')).not.toThrow()
    expect(() => assertValidMaintenanceAttachment(0, 'image/png')).toThrow(
      MaintenanceAttachmentValidationError,
    )
    expect(() => assertValidMaintenanceAttachment(8 * 1024 * 1024 + 1, 'image/png')).toThrow(
      MaintenanceAttachmentValidationError,
    )
    expect(() => assertValidMaintenanceAttachment(10, 'application/pdf')).toThrow(
      MaintenanceAttachmentValidationError,
    )
  })

  it('resolves a maintenance key into the stored attachment URL', () => {
    expect(resolveMaintenanceMediaObject(admin, ['maintenance', 'tenant-1', 'a.png'])).toEqual({
      objectKey: 'maintenance/tenant-1/a.png',
      tenantId: 'tenant-1',
      url: '/api/maintenance/media/maintenance/tenant-1/a.png',
    })
  })

  it.each([
    [['properties', 'tenant-1', 'a.png']],
    [['maintenance', 'tenant-1']],
    [['maintenance', 'tenant-1', '..', 'a.png']],
    [['maintenance', 'tenant-1', '', 'a.png']],
    [['maintenance', 'other-tenant', 'a.png']],
  ])('answers %j as not found for agency users', (key) => {
    expect(() => resolveMaintenanceMediaObject(admin, key)).toThrow(MaintenanceTicketNotFoundError)
  })

  it('lets renters reach other tenants, leaving membership to the ticket check', () => {
    expect(
      resolveMaintenanceMediaObject(renter, ['maintenance', 'other-tenant', 'a.png']).tenantId,
    ).toBe('other-tenant')
  })
})
