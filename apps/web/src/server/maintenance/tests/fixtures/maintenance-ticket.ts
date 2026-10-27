import { vi } from 'vitest'
import type {
  MaintenanceActor,
  MaintenanceContract,
  MaintenanceTicket,
} from '../../types/maintenance-ticket'
import type { MaintenanceTicketRepository } from '../../types/maintenance-ticket-repository'

export function actor(
  role: MaintenanceActor['actorPapel'],
  id = role === 'PROPERTY_OWNER' ? 'owner' : role.toLowerCase(),
  tenantId = 'tenant-1',
): MaintenanceActor {
  return { actorId: id, actorPapel: role, actorTenantId: tenantId, actorName: id }
}

export const admin = actor('OWNER', 'admin')

export const agent = actor('AGENT')

export const owner = actor('PROPERTY_OWNER')

export const renter = actor('RENTER')

export const contract: MaintenanceContract = {
  id: 'contract-1',
  tenantId: 'tenant-1',
  code: 'C-1',
  propertyId: 'property-1',
  propertyTitle: 'Property',
  agentId: 'agent',
  ownerId: 'owner',
  renterIds: ['renter'],
  parties: [],
}

export const ticket: MaintenanceTicket = {
  id: 'ticket-1',
  tenantId: 'tenant-1',
  propertyId: 'property-1',
  propertyTitle: 'Property',
  contractId: contract.id,
  responsibleId: null,
  responsibleName: null,
  provider: null,
  completedByRole: null,
  deletedAt: null,
  replacementRequests: [],
  category: 'Plumbing',
  priority: 'URGENTE',
  status: 'ABERTO',
  title: 'Leak',
  description: 'Kitchen leak',
  openedById: 'renter',
  openedByName: 'Renter',
  resolvedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  activities: [],
  attachments: [],
  access: { agentId: 'agent', ownerId: 'owner', renterIds: ['renter'], validContract: true },
}

export function repository(
  overrides: Partial<MaintenanceTicket> = {},
  methods: Partial<MaintenanceTicketRepository> = {},
): MaintenanceTicketRepository {
  const current = { ...ticket, ...overrides }
  return {
    findContract: vi.fn().mockResolvedValue(contract),
    findUser: vi.fn().mockResolvedValue({ id: 'agent', role: 'AGENT' }),
    options: vi.fn(),
    linkUsers: vi.fn(),
    create: vi.fn().mockResolvedValue(current),
    findMany: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    findById: vi.fn().mockResolvedValue(current),
    findAttachmentTicket: vi.fn().mockResolvedValue(current),
    mutate: vi.fn().mockImplementation(async (_ticket, changes) => ({ ...current, ...changes })),
    addNote: vi.fn(),
    addAttachment: vi.fn(),
    findActivities: vi.fn().mockResolvedValue([]),
    ...methods,
  }
}
