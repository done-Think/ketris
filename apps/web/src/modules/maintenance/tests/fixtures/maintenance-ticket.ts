import type {
  ApiMaintenanceTicket,
  ApiMaintenanceTicketListItem,
  MaintenancePermissions,
} from '../../types/service'

export function maintenancePermissionsFixture(
  overrides: Partial<MaintenancePermissions> = {},
): MaintenancePermissions {
  return {
    linkContract: false,
    schedule: false,
    edit: false,
    comment: false,
    collaborate: false,
    assume: false,
    assign: false,
    provider: false,
    requestReplacement: false,
    start: false,
    complete: false,
    finish: false,
    confirm: false,
    contest: false,
    cancel: false,
    reopen: false,
    delete: false,
    restore: false,
    ...overrides,
  }
}

export function maintenanceTicketFixture(
  overrides: Partial<ApiMaintenanceTicket> = {},
): ApiMaintenanceTicket {
  return {
    id: 'ticket',
    propertyId: 'property',
    propertyTitle: 'Property',
    contractId: null,
    scheduledAt: null,
    responsibleId: null,
    responsibleName: null,
    provider: null,
    completedByRole: null,
    deletedAt: null,
    replacementRequests: [],
    permissions: maintenancePermissionsFixture(),
    category: 'PLUMBING',
    priority: 'NORMAL',
    status: 'OPEN',
    title: 'Ticket',
    description: 'Ticket description',
    openedById: 'user',
    openedByName: 'User',
    resolvedAt: null,
    createdAt: '2026-10-29T12:00:00.000Z',
    updatedAt: '2026-10-29T12:00:00.000Z',
    activities: [],
    attachments: [],
    ...overrides,
  }
}

export function maintenanceTicketListItemFixture(
  overrides: Partial<ApiMaintenanceTicketListItem> = {},
): ApiMaintenanceTicketListItem {
  const {
    activities,
    attachments,
    description,
    openedById,
    provider,
    completedByRole,
    replacementRequests,
    ...item
  } = maintenanceTicketFixture()
  return { ...item, ...overrides }
}
