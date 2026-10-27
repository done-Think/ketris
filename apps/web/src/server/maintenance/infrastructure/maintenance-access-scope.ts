import type { Prisma } from '@prisma/client'
import { isAgencyManager } from '@server/auth/domain/roles'
import type { MaintenanceActor } from '../types/maintenance-ticket'
import type { MaintenanceContractRow } from '../types/prisma-maintenance-ticket-repository'

export function maintenanceTicketScope(
  actor: MaintenanceActor,
): Prisma.ChamadoManutencaoWhereInput {
  if (actor.actorPapel === 'RENTER') {
    return { excluidoEm: null, contrato: { is: renterContractScope(actor.actorId) } }
  }
  const base: Prisma.ChamadoManutencaoWhereInput = { tenantId: actor.actorTenantId }
  if (isAgencyManager(actor.actorPapel)) return base
  base.excluidoEm = null
  base.contrato = { is: { tenantId: actor.actorTenantId } }
  if (actor.actorPapel === 'AGENT')
    base.OR = [
      { responsavelId: actor.actorId },
      { imovel: { responsavelId: actor.actorId, tenantId: actor.actorTenantId } },
    ]
  else if (actor.actorPapel === 'PROPERTY_OWNER')
    base.OR = [
      { responsavelId: actor.actorId },
      { imovel: { proprietarioId: actor.actorId, tenantId: actor.actorTenantId } },
    ]
  else base.id = { in: [] }
  return base
}

export function renterContractScope(userId: string): Prisma.ContratoWhereInput {
  return {
    partes: {
      some: { papel: 'LOCATARIO', usuarioId: userId, usuario: { ativo: true, papel: 'RENTER' } },
    },
  }
}

export function validContract(row: MaintenanceContractRow): boolean {
  return row.tenantId === row.imovel.tenantId
}
