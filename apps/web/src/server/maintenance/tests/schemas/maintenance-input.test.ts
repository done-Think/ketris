// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { resolveMaintenanceTicketRequestSchema } from '../../schemas/maintenance-attachment.schema'
import {
  createMaintenanceProviderRequestSchema,
  updateMaintenanceProviderRequestSchema,
} from '../../schemas/maintenance-provider.schema'
import {
  addMaintenanceTicketNoteRequestSchema,
  createMaintenanceTicketRequestSchema,
  maintenanceActionSchema,
  maintenanceLinksSchema,
  updateMaintenanceTicketRequestSchema,
} from '../../schemas/maintenance-ticket-input.schema'
import {
  maintenanceCompleteUploadRequestSchema,
  maintenanceUploadMetadataSchema,
} from '../../schemas/maintenance-upload.schema'

const ticket = {
  contractId: 'contract',
  propertyId: 'property',
  category: 'Hidráulica',
  priority: 'NORMAL',
  title: 'Leak',
  description: 'Kitchen leak',
}
const metadata = {
  filename: 'repair.png',
  contentType: 'image/png',
  size: 8 * 1024 * 1024,
  sha256: 'a'.repeat(64),
}

describe('Maintenance input contracts', () => {
  it.each([
    [createMaintenanceTicketRequestSchema, ticket],
    [updateMaintenanceTicketRequestSchema, { description: 'Updated' }],
    [addMaintenanceTicketNoteRequestSchema, { message: 'Details' }],
    [maintenanceActionSchema, { action: 'provider', provider: { id: 'provider' } }],
    [maintenanceLinksSchema, { contractId: 'contract', ownerId: 'owner' }],
    [createMaintenanceProviderRequestSchema, { provider: { name: 'Professional' } }],
    [updateMaintenanceProviderRequestSchema, { active: false }],
    [maintenanceUploadMetadataSchema, metadata],
    [maintenanceCompleteUploadRequestSchema, { token: 'signed-token' }],
    [resolveMaintenanceTicketRequestSchema, {}],
  ])('keeps supported fields and rejects unknown actor or payload fields', (schema, payload) => {
    expect(schema.safeParse(payload).success).toBe(true)
    expect(schema.safeParse({ ...payload, actorId: 'forged-user' }).success).toBe(false)
  })
  it('preserves the property consistency check and maps only known category labels', () => {
    expect(createMaintenanceTicketRequestSchema.parse(ticket)).toMatchObject({
      propertyId: 'property',
      category: 'PLUMBING',
    })
    expect(
      createMaintenanceTicketRequestSchema.parse({ ...ticket, category: 'Serralheria' }).category,
    ).toBe('Serralheria')
  })
  it('does not let a selected provider override activity metadata or catalog state', () => {
    expect(
      maintenanceActionSchema.safeParse({
        action: 'provider',
        provider: { id: 'provider', active: true },
      }).success,
    ).toBe(false)
    expect(
      addMaintenanceTicketNoteRequestSchema.safeParse({
        message: 'Note',
        systemAction: 'TICKET_CREATED',
      }).success,
    ).toBe(false)
  })
  it.each([
    ['title', 201],
    ['category', 101],
    ['description', 10001],
  ] as const)('enforces the approved %s limit', (field, length) => {
    expect(
      createMaintenanceTicketRequestSchema.safeParse({ ...ticket, [field]: 'x'.repeat(length) })
        .success,
    ).toBe(false)
  })
  it('rejects empty or oversized images and keeps the full 8 MB limit', () => {
    expect(maintenanceUploadMetadataSchema.safeParse(metadata).success).toBe(true)
    for (const changed of [
      { size: 0 },
      { size: metadata.size + 1 },
      { contentType: 'text/html' },
      { sha256: 'invalid' },
    ])
      expect(maintenanceUploadMetadataSchema.safeParse({ ...metadata, ...changed }).success).toBe(
        false,
      )
  })
})
