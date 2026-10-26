import { expect, it } from 'vitest'
import {
  createMaintenanceTicketRequestSchema,
  maintenanceActionSchema,
  updateMaintenanceTicketRequestSchema,
} from '../../schemas/maintenance-ticket-input.schema'

it('accepts optional service dates with an explicit timezone and rejects invalid appointments', () => {
  const ticket = {
    contractId: 'contract',
    category: 'PLUMBING',
    priority: 'NORMAL',
    title: 'Leak',
    description: 'Kitchen leak',
  }
  expect(createMaintenanceTicketRequestSchema.parse(ticket).scheduledAt).toBeUndefined()
  expect(
    createMaintenanceTicketRequestSchema.parse({
      ...ticket,
      scheduledAt: '2026-10-24T14:00:00-03:00',
    }).scheduledAt,
  ).toEqual(new Date('2026-10-24T17:00:00Z'))
  for (const scheduledAt of ['invalid', '', '2026-10-24T14:00:00']) {
    expect(createMaintenanceTicketRequestSchema.safeParse({ ...ticket, scheduledAt }).success).toBe(
      false,
    )
  }
})

it('requires a timezone-aware date when scheduling through the dedicated action', () => {
  expect(
    maintenanceActionSchema.parse({ action: 'schedule', scheduledAt: '2026-10-24T14:00:00-03:00' }),
  ).toEqual({ action: 'schedule', scheduledAt: '2026-10-24T14:00:00-03:00' })
  for (const scheduledAt of [undefined, null, '', '2026-10-24T14:00'])
    expect(maintenanceActionSchema.safeParse({ action: 'schedule', scheduledAt }).success).toBe(
      false,
    )
})

it('distinguishes preserving, clearing and replacing a service appointment', () => {
  expect(updateMaintenanceTicketRequestSchema.parse({ title: 'Leak' }).scheduledAt).toBeUndefined()
  expect(updateMaintenanceTicketRequestSchema.parse({ scheduledAt: null }).scheduledAt).toBeNull()
  expect(
    updateMaintenanceTicketRequestSchema.parse({ scheduledAt: '2026-10-24T17:00:00Z' }).scheduledAt,
  ).toEqual(new Date('2026-10-24T17:00:00Z'))
})
