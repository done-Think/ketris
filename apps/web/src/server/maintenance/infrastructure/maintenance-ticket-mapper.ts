import type { Prisma } from '@prisma/client'
import type {
  MaintenanceActivity,
  MaintenanceAttachment,
  MaintenanceContract,
  MaintenanceTicket,
  NewMaintenanceActivity,
} from '../types/maintenance-ticket'
import type {
  MaintenanceContractRow,
  MaintenanceTicketRow,
} from '../types/prisma-maintenance-ticket-repository'

export const contractInclude = {
  property: true,
  parties: { include: { user: { select: { active: true, role: true } } } },
} as const

export const ticketInclude = {
  property: true,
  contract: { include: contractInclude },
  responsible: { select: { name: true } },
  activities: { orderBy: { createdAt: 'asc' as const } },
  attachments: true,
  changeRequests: { orderBy: { createdAt: 'desc' as const } },
}

export function toContract(row: MaintenanceContractRow): MaintenanceContract {
  return {
    id: row.id,
    tenantId: row.tenantId,
    code: row.code,
    propertyId: row.propertyId,
    propertyTitle: row.property.title,
    agentId: row.property.responsibleId,
    ownerId: row.property.ownerId,
    renterIds: row.parties
      .filter((p) => p.role === 'RENTER' && p.userId && p.user?.active && p.user.role === 'RENTER')
      .map((p) => p.userId!),
    parties: row.parties.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      userId: p.userId,
    })),
  }
}

export function toActivity(row: MaintenanceTicketRow['activities'][number]): MaintenanceActivity {
  return {
    id: row.id,
    ticketId: row.ticketId,
    type: row.type,
    message: row.message,
    systemAction: row.systemAction,
    authorId: row.authorId,
    authorName: row.authorName,
    createdAt: row.createdAt,
    details: row.details as Record<string, unknown> | null,
  }
}

export function toAttachment(
  row: MaintenanceTicketRow['attachments'][number],
): MaintenanceAttachment {
  return {
    id: row.id,
    ticketId: row.ticketId,
    name: row.name,
    url: row.url,
    createdAt: row.createdAt,
  }
}

export function toTicket(row: MaintenanceTicketRow): MaintenanceTicket {
  const contract = row.contract ? toContract(row.contract) : null
  return {
    id: row.id,
    tenantId: row.tenantId,
    propertyId: row.propertyId,
    propertyTitle: row.property.title,
    contractId: row.contractId,
    responsibleId: row.responsibleId,
    responsibleName: row.responsible?.name ?? null,
    provider: row.providerName
      ? {
          ...(row.providerId ? { id: row.providerId } : {}),
          name: row.providerName,
          phone: row.providerPhone,
          email: row.providerEmail,
          notes: row.providerNotes,
        }
      : null,
    completedByRole: row.completedByRole,
    deletedAt: row.deletedAt,
    category: row.category,
    priority: row.priority,
    status: row.status,
    title: row.title,
    description: row.description,
    openedById: row.openedById,
    openedByName: row.openedByName,
    resolvedAt: row.resolvedAt,
    scheduledAt: row.serviceAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    activities: row.activities.map(toActivity),
    attachments: row.attachments.map(toAttachment),
    replacementRequests: row.changeRequests.map((r) => ({
      id: r.id,
      reason: r.justification,
      requestedById: r.requesterId,
      requestedByName: r.requesterName,
      status: r.status,
      decisionReason: r.decisionJustification,
      decidedByName: r.decidedByName,
      decidedAt: r.decidedAt,
      createdAt: r.createdAt,
    })),
    access: {
      agentId: row.property.responsibleId,
      ownerId: row.property.ownerId,
      renterIds: contract?.renterIds ?? [],
      validContract: Boolean(
        contract &&
        contract.propertyId === row.propertyId &&
        row.contract?.tenantId === row.tenantId &&
        row.property.tenantId === row.tenantId,
      ),
    },
  }
}

export function activityData(
  ticketId: string,
  activity: NewMaintenanceActivity,
): Prisma.MaintenanceTicketActivityUncheckedCreateInput {
  return {
    ticketId: ticketId,
    type: activity.type,
    message: activity.message,
    systemAction:
      activity.systemAction ?? (activity.authorId ? undefined : `SYSTEM_${activity.type}`),
    authorId: activity.authorId,
    authorName: activity.authorName,
    ...(activity.details
      ? { details: JSON.parse(JSON.stringify(activity.details)) as Prisma.InputJsonObject }
      : {}),
  }
}
