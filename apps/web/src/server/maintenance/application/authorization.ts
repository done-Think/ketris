import { ForbiddenError, ConflictError } from '@server/shared/errors'
import { MaintenanceTicketNotFoundError } from '../domain/errors'
import type {
  MaintenanceActor,
  MaintenanceContract,
  MaintenancePermissions,
  MaintenanceTicket,
} from '../types/maintenance-ticket'

export function canAccessContract(actor: MaintenanceActor, contract: MaintenanceContract): boolean {
  if (actor.actorPapel !== 'RENTER' && contract.tenantId !== actor.actorTenantId) return false
  switch (actor.actorPapel) {
    case 'ADMIN':
      return true
    case 'AGENT':
      return contract.agentId === actor.actorId
    case 'OWNER':
      return contract.ownerId === actor.actorId
    case 'RENTER':
      return contract.renterIds.includes(actor.actorId)
    default:
      return false
  }
}

export function canAccessTicket(actor: MaintenanceActor, ticket: MaintenanceTicket): boolean {
  if (actor.actorPapel !== 'RENTER' && ticket.tenantId !== actor.actorTenantId) return false
  if (actor.actorPapel === 'ADMIN') return true
  if (ticket.deletedAt || !ticket.access.validContract) return false
  switch (actor.actorPapel) {
    case 'AGENT':
      return ticket.responsibleId === actor.actorId || ticket.access.agentId === actor.actorId
    case 'OWNER':
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
  if (actor.actorPapel !== 'ADMIN') throw new ForbiddenError()
}

export function isTerminal(ticket: MaintenanceTicket): boolean {
  return ['RESOLVIDO', 'CANCELADO', 'FECHADO'].includes(ticket.status)
}

export function permissionsFor(
  actor: MaintenanceActor,
  ticket: MaintenanceTicket,
): MaintenancePermissions {
  const access = canAccessTicket(actor, ticket)
  const admin = access && actor.actorPapel === 'ADMIN'
  const owner = access && actor.actorPapel === 'OWNER' && ticket.access.ownerId === actor.actorId
  const renter = access && actor.actorPapel === 'RENTER'
  const manager = admin || (access && ['AGENT', 'OWNER'].includes(actor.actorPapel))
  const responsible = manager && ticket.responsibleId === actor.actorId
  const active = access && !ticket.deletedAt && !isTerminal(ticket)
  const pending = active && ticket.status === 'AGUARDANDO_CONFIRMACAO'
  return {
    linkContract: admin,
    schedule: active && Boolean(ticket.provider) && (renter || manager),
    edit: active && manager,
    comment: active || (renter && !ticket.deletedAt && ticket.status === 'RESOLVIDO'),
    collaborate: active,
    assume: active && !ticket.responsibleId && ['AGENT', 'OWNER'].includes(actor.actorPapel),
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
    confirm: pending && (admin || (owner && ticket.completedByRole !== 'OWNER')),
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

export function publicTicket(ticket: MaintenanceTicket, actor: MaintenanceActor) {
  const result: Partial<MaintenanceTicket> = { ...ticket }
  delete result.access
  return { ...result, permissions: permissionsFor(actor, ticket) }
}
