import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError, ConflictError } from '@server/shared/errors'
import { MaintenanceTicketNotFoundError } from './errors'
import type {
  MaintenanceActor,
  MaintenanceContract,
  MaintenancePermissions,
  MaintenanceTicket,
} from '../types/maintenance-ticket'

export function canAccessContract(actor: MaintenanceActor, contract: MaintenanceContract): boolean {
  if (actor.actorPapel !== 'RENTER' && contract.tenantId !== actor.actorTenantId) return false
  if (isAgencyManager(actor.actorPapel)) return true
  switch (actor.actorPapel) {
    case 'AGENT':
      return contract.agentId === actor.actorId
    case 'PROPERTY_OWNER':
      return contract.ownerId === actor.actorId
    case 'RENTER':
      return contract.renterIds.includes(actor.actorId)
    default:
      return false
  }
}

export function canAccessTicket(actor: MaintenanceActor, ticket: MaintenanceTicket): boolean {
  if (actor.actorPapel !== 'RENTER' && ticket.tenantId !== actor.actorTenantId) return false
  if (isAgencyManager(actor.actorPapel)) return true
  if (ticket.deletedAt || !ticket.access.validContract) return false
  switch (actor.actorPapel) {
    case 'AGENT':
      return ticket.responsibleId === actor.actorId || ticket.access.agentId === actor.actorId
    case 'PROPERTY_OWNER':
      return ticket.responsibleId === actor.actorId || ticket.access.ownerId === actor.actorId
    case 'RENTER':
      return ticket.access.renterIds.includes(actor.actorId)
    default:
      return false
  }
}

export function assertTicketAccess(
  actor: MaintenanceActor,
  ticket: MaintenanceTicket | null,
): asserts ticket is MaintenanceTicket {
  if (!ticket || !canAccessTicket(actor, ticket)) throw new MaintenanceTicketNotFoundError()
}

export function assertAdmin(actor: MaintenanceActor) {
  if (!isAgencyManager(actor.actorPapel)) throw new ForbiddenError()
}

export function isTerminal(ticket: MaintenanceTicket): boolean {
  return ['RESOLVIDO', 'CANCELADO', 'FECHADO'].includes(ticket.status)
}

export function permissionsFor(
  actor: MaintenanceActor,
  ticket: MaintenanceTicket,
): MaintenancePermissions {
  const access = canAccessTicket(actor, ticket)
  const admin = access && isAgencyManager(actor.actorPapel)
  const owner =
    access && actor.actorPapel === 'PROPERTY_OWNER' && ticket.access.ownerId === actor.actorId
  const renter = access && actor.actorPapel === 'RENTER'
  const manager = admin || (access && ['AGENT', 'PROPERTY_OWNER'].includes(actor.actorPapel))
  const responsible = manager && ticket.responsibleId === actor.actorId
  const active = access && !ticket.deletedAt && !isTerminal(ticket)
  const pending = active && ticket.status === 'AGUARDANDO_CONFIRMACAO'
  return {
    linkContract: admin,
    schedule: active && Boolean(ticket.provider) && (renter || manager),
    edit: active && manager,
    comment: active || (renter && !ticket.deletedAt && ticket.status === 'RESOLVIDO'),
    collaborate: active,
    assume:
      active && !ticket.responsibleId && ['AGENT', 'PROPERTY_OWNER'].includes(actor.actorPapel),
    assign: active && admin,
    provider: active && (admin || renter || (responsible && actor.actorPapel === 'AGENT')),
    requestReplacement:
      active &&
      owner &&
      Boolean(ticket.provider) &&
      !ticket.replacementRequests.some((r) => r.status === 'PENDENTE'),
    start: active && (admin || responsible) && ['ABERTO', 'CONTESTADO'].includes(ticket.status),
    finish: active && renter,
    complete:
      active &&
      ticket.access.validContract &&
      (admin || responsible) &&
      ticket.status === 'EM_ANDAMENTO',
    confirm: pending && (admin || (owner && ticket.completedByRole !== 'PROPERTY_OWNER')),
    contest: pending && (admin || owner || renter),
    cancel: active && admin,
    reopen:
      access &&
      !ticket.deletedAt &&
      ((admin && isTerminal(ticket) && ticket.status !== 'FECHADO') ||
        (renter && ticket.status === 'RESOLVIDO')),
    delete: access && !ticket.deletedAt && admin,
    restore: access && Boolean(ticket.deletedAt) && admin,
  }
}

export function assertPermission(
  actor: MaintenanceActor,
  ticket: MaintenanceTicket,
  permission: keyof MaintenancePermissions,
) {
  assertTicketAccess(actor, ticket)
  if (!permissionsFor(actor, ticket)[permission]) {
    if (ticket.deletedAt || isTerminal(ticket))
      throw new ConflictError('O chamado esta arquivado ou encerrado.')
    throw new ForbiddenError('Acao nao permitida para este usuario ou status.')
  }
}
