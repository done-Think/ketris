import type { Prisma } from '@prisma/client'
import { isAgencyManager } from '@server/auth/domain/roles'
import type { MaintenanceActor } from '../types/maintenance-ticket'
import type { MaintenanceContractRow } from '../types/prisma-maintenance-ticket-repository'

export function maintenanceTicketScope(
  actor: MaintenanceActor,
): Prisma.MaintenanceTicketWhereInput {
  if (actor.actorRole === 'RENTER') {
    return { deletedAt: null, contract: { is: renterContractScope(actor.actorId) } }
  }
  const base: Prisma.MaintenanceTicketWhereInput = { tenantId: actor.actorTenantId }
  if (isAgencyManager(actor.actorRole)) return base
  base.deletedAt = null
  base.contract = { is: { tenantId: actor.actorTenantId } }
  if (actor.actorRole === 'AGENT')
    base.OR = [
      { responsibleId: actor.actorId },
      { property: { responsibleId: actor.actorId, tenantId: actor.actorTenantId } },
    ]
  else if (actor.actorRole === 'PROPERTY_OWNER')
    base.OR = [
      { responsibleId: actor.actorId },
      { property: { ownerId: actor.actorId, tenantId: actor.actorTenantId } },
    ]
  else base.id = { in: [] }
  return base
}

export function renterContractScope(userId: string): Prisma.ContractWhereInput {
  return {
    parties: {
      some: { role: 'RENTER', userId: userId, user: { active: true, role: 'RENTER' } },
    },
  }
}

export function validContract(row: MaintenanceContractRow): boolean {
  return row.tenantId === row.property.tenantId
}
