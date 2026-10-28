import { isAgencyManager } from '@server/auth/domain/roles'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { MaintenanceTicketNotFoundError } from '../domain/errors'
import type {
  MaintenanceActor,
  MaintenanceContract,
  MaintenancePermissions,
  MaintenanceTicket,
} from '../types/maintenance-ticket'

export function canAccessContract(actor: MaintenanceActor, contract: MaintenanceContract): boolean {
  if (actor.actorRole !== 'RENTER' && contract.tenantId !== actor.actorTenantId) return false
  if (isAgencyManager(actor.actorRole)) return true
  switch (actor.actorRole) {
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
  if (actor.actorRole !== 'RENTER' && ticket.tenantId !== actor.actorTenantId) return false
  if (isAgencyManager(actor.actorRole)) return true
  if (ticket.deletedAt || !ticket.access.validContract) return false
  switch (actor.actorRole) {
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
  if (!isAgencyManager(actor.actorRole)) throw new ForbiddenError()
}

export function isTerminal(ticket: MaintenanceTicket): boolean {
  return ['RESOLVED', 'CANCELED', 'CLOSED'].includes(ticket.status)
}

export function permissionsFor(
  actor: MaintenanceActor,
  ticket: MaintenanceTicket,
): MaintenancePermissions {
  const access = canAccessTicket(actor, ticket)
  const admin = access && isAgencyManager(actor.actorRole)
  const owner =
    access && actor.actorRole === 'PROPERTY_OWNER' && ticket.access.ownerId === actor.actorId
  const renter = access && actor.actorRole === 'RENTER'
  const manager = admin || (access && ['AGENT', 'PROPERTY_OWNER'].includes(actor.actorRole))
  const responsible = manager && ticket.responsibleId === actor.actorId
  const active = access && !ticket.deletedAt && !isTerminal(ticket)
  const pending = active && ticket.status === 'AWAITING_CONFIRMATION'
  return {
    linkContract: admin,
    schedule: active && Boolean(ticket.provider) && (renter || manager),
    edit: active && manager,
    comment: active || (renter && !ticket.deletedAt && ticket.status === 'RESOLVED'),
    collaborate: active,
    assume:
      active && !ticket.responsibleId && ['AGENT', 'PROPERTY_OWNER'].includes(actor.actorRole),
    assign: active && admin,
    provider: active && (admin || renter || (responsible && actor.actorRole === 'AGENT')),
    requestReplacement:
      active &&
      owner &&
      Boolean(ticket.provider) &&
      !ticket.replacementRequests.some((r) => r.status === 'PENDING'),
    start: active && (admin || responsible) && ['OPEN', 'DISPUTED'].includes(ticket.status),
    finish: active && renter,
    complete:
      active &&
      ticket.access.validContract &&
      (admin || responsible) &&
      ticket.status === 'IN_PROGRESS',
    confirm: pending && (admin || (owner && ticket.completedByRole !== 'PROPERTY_OWNER')),
    contest: pending && (admin || owner || renter),
    cancel: active && admin,
    reopen:
      access &&
      !ticket.deletedAt &&
      ((admin && isTerminal(ticket) && ticket.status !== 'CLOSED') ||
        (renter && ticket.status === 'RESOLVED')),
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

export function assertCanDefineProvider(actor: MaintenanceActor, ticket: MaintenanceTicket) {
  assertPermission(actor, ticket, 'provider')
  if (ticket.replacementRequests.some((request) => request.status === 'PENDING'))
    throw new ConflictError('Decida a solicitação pendente antes de trocar o prestador.')
}
