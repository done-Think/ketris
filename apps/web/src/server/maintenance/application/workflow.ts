import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { MaintenancePropertyNotFoundError } from '../domain/errors'
import type {
  MaintenanceAction,
  MaintenanceActor,
  MaintenanceMutation,
  MaintenanceProvider,
  MaintenanceRequestMutation,
  MaintenanceTicket,
  MaintenanceTicketUpdate,
  NewMaintenanceActivity,
} from '../types/maintenance-ticket'
import type { MaintenanceTicketRepository } from '../types/maintenance-ticket-repository'
import {
  assertAdmin,
  assertPermission,
  assertTicketAccess,
  canAccessContract,
  permissionsFor,
} from './authorization'

export async function loadTicket(
  repository: MaintenanceTicketRepository,
  actor: MaintenanceActor,
  ticketId: string,
) {
  const ticket = await repository.findById(
    actor.actorTenantId,
    ticketId,
    actor.actorPapel === 'ADMIN',
  )
  assertTicketAccess(actor, ticket)
  return { ...ticket, permissions: permissionsFor(actor, ticket) }
}

export async function validateContract(
  repository: MaintenanceTicketRepository,
  actor: MaintenanceActor,
  contractId: string,
  propertyId?: string,
) {
  const contract = await repository.findContract(actor.actorTenantId, contractId)
  if (
    !contract ||
    (propertyId && propertyId !== contract.propertyId) ||
    !canAccessContract(actor, contract)
  ) {
    throw new MaintenancePropertyNotFoundError()
  }
  return contract
}

function activity(
  actor: MaintenanceActor,
  type: NewMaintenanceActivity['type'],
  message: string,
  details?: Record<string, unknown>,
): NewMaintenanceActivity {
  return { type, message, details, authorId: actor.actorId, authorName: actor.actorName }
}

function reason(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) throw new ConflictError('Informe uma justificativa.')
  return trimmed
}

function provider(value: MaintenanceProvider): MaintenanceProvider {
  if (!value.name.trim()) throw new ConflictError('Informe o nome do prestador.')
  return {
    name: value.name.trim(),
    phone: value.phone?.trim() || null,
    email: value.email?.trim() || null,
    notes: value.notes?.trim() || null,
  }
}

export async function updateTicket(
  repository: MaintenanceTicketRepository,
  actor: MaintenanceActor,
  ticketId: string,
  changes: MaintenanceTicketUpdate,
) {
  const ticket = await loadTicket(repository, actor, ticketId)
  assertPermission(actor, ticket, 'edit')
  if (changes.scheduledAt !== undefined) assertPermission(actor, ticket, 'schedule')
  if (
    (changes.contractId && changes.contractId !== ticket.contractId) ||
    (changes.propertyId && changes.propertyId !== ticket.propertyId)
  ) {
    if (!changes.contractId && !ticket.contractId)
      throw new ConflictError('Selecione o contrato do chamado.')
    // Changing a tenant/owner relationship is an administrative operation, not a renter edit.
    if (
      actor.actorPapel === 'RENTER' &&
      ((changes.contractId && changes.contractId !== ticket.contractId) ||
        (changes.propertyId && changes.propertyId !== ticket.propertyId))
    )
      throw new ForbiddenError()
    const contract = await validateContract(
      repository,
      actor,
      changes.contractId ?? ticket.contractId!,
      changes.propertyId,
    )
    changes = { ...changes, contractId: contract.id, propertyId: contract.propertyId }
  }
  const changed = Object.fromEntries(
    Object.entries(changes).filter(([, value]) => value !== undefined),
  )
  return repository.mutate(
    ticket,
    changes,
    activity(actor, 'EDICAO', 'Dados do chamado atualizados.', {
      before: Object.fromEntries(
        Object.keys(changed).map((key) => [key, ticket[key as keyof MaintenanceTicket]]),
      ),
      after: changed,
    }),
  )
}

export async function deleteTicket(
  repository: MaintenanceTicketRepository,
  actor: MaintenanceActor,
  ticketId: string,
) {
  const ticket = await loadTicket(repository, actor, ticketId)
  assertPermission(actor, ticket, 'delete')
  return repository.mutate(
    ticket,
    { deletedAt: new Date(), deletedById: actor.actorId },
    activity(actor, 'EXCLUSAO', 'Chamado arquivado.', { status: ticket.status }),
  )
}

export async function actOnTicket(
  repository: MaintenanceTicketRepository,
  actor: MaintenanceActor,
  ticketId: string,
  action: MaintenanceAction,
) {
  const ticket = await loadTicket(repository, actor, ticketId)
  let changes: MaintenanceMutation = {}
  let event: NewMaintenanceActivity
  let request: MaintenanceRequestMutation | undefined
  switch (action.action) {
    case 'linkContract': {
      assertAdmin(actor)
      const contract = await validateContract(
        repository,
        actor,
        action.contractId,
        ticket.propertyId,
      )
      return repository.mutate(
        ticket,
        { contractId: contract.id },
        activity(actor, 'EDICAO', 'Contrato do chamado associado pelo administrador.', {
          before: { contractId: ticket.contractId, propertyId: ticket.propertyId },
          after: { contractId: contract.id, propertyId: ticket.propertyId },
        }),
      )
    }
    case 'schedule': {
      assertPermission(actor, ticket, 'schedule')
      const scheduledAt = new Date(action.scheduledAt)
      if (Number.isNaN(scheduledAt.getTime()))
        throw new ConflictError('Informe uma data de atendimento valida.')
      return repository.mutate(
        ticket,
        { scheduledAt },
        activity(actor, 'EDICAO', 'Atendimento agendado com o prestador.', {
          before: { scheduledAt: ticket.scheduledAt?.toISOString() ?? null },
          after: { scheduledAt: scheduledAt.toISOString() },
          provider: ticket.provider?.name,
        }),
      )
    }
    case 'finish': {
      assertPermission(actor, ticket, 'finish')
      const resolvedAt = new Date()
      return repository.mutate(
        ticket,
        {
          status: 'RESOLVIDO',
          resolvedAt,
          completedByRole: actor.actorPapel,
          completedById: actor.actorId,
        },
        activity(actor, 'MUDANCA_STATUS', 'Chamado finalizado pelo locatário.', {
          before: ticket.status,
          after: 'RESOLVIDO',
          resolvedAt: resolvedAt.toISOString(),
          previousCompletionRole: ticket.completedByRole,
        }),
      )
    }
    case 'start':
      assertPermission(actor, ticket, 'start')
      changes = { status: 'EM_ANDAMENTO' }
      break
    case 'complete':
      assertPermission(actor, ticket, 'complete')
      if (!ticket.contractId)
        throw new ConflictError('Regularize o contrato antes de concluir o chamado.')
      changes = {
        status: 'AGUARDANDO_CONFIRMACAO',
        completedByRole: actor.actorPapel,
        completedById: actor.actorId,
      }
      break
    case 'confirm':
      assertPermission(actor, ticket, 'confirm')
      changes = { status: 'RESOLVIDO', resolvedAt: new Date() }
      break
    case 'contest':
      assertPermission(actor, ticket, 'contest')
      changes = { status: 'CONTESTADO', resolvedAt: null }
      break
    case 'cancel':
      assertPermission(actor, ticket, 'cancel')
      changes = { status: 'CANCELADO', resolvedAt: null }
      break
    case 'reopen': {
      assertPermission(actor, ticket, 'reopen')
      if (!['ABERTO', 'EM_ANDAMENTO'].includes(action.status))
        throw new ConflictError('Status de reabertura invalido.')
      if (actor.actorPapel === 'RENTER' && action.status !== 'ABERTO')
        throw new ForbiddenError('O locatario pode reabrir o chamado somente como aberto.')
      const reopenReason =
        actor.actorPapel === 'RENTER' || action.reason !== undefined
          ? reason(action.reason ?? '')
          : null
      changes = {
        status: action.status,
        resolvedAt: null,
        completedById: null,
        completedByRole: null,
      }
      return repository.mutate(
        ticket,
        changes,
        activity(actor, 'MUDANCA_STATUS', reopenReason ?? 'Chamado reaberto.', {
          before: ticket.status,
          after: changes.status,
          reason: reopenReason,
          previousResolution: {
            resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
            completedByRole: ticket.completedByRole,
          },
        }),
      )
    }
    case 'assume':
    case 'assign': {
      assertPermission(actor, ticket, action.action)
      const responsibleId = action.action === 'assume' ? actor.actorId : action.responsibleId
      const user = await repository.findUser(actor.actorTenantId, responsibleId)
      if (!user || !['ADMIN', 'AGENT', 'OWNER'].includes(user.role))
        throw new ForbiddenError('Responsavel invalido para esta corretora.')
      changes = { responsibleId }
      event = activity(actor, 'RESPONSAVEL_ALTERADO', 'Responsavel interno atualizado.', {
        before: ticket.responsibleId,
        after: responsibleId,
      })
      return repository.mutate(ticket, changes, event)
    }
    case 'restore':
      assertPermission(actor, ticket, 'restore')
      return repository.mutate(
        ticket,
        { deletedAt: null, deletedById: null },
        activity(actor, 'RESTAURACAO', 'Chamado restaurado.', { status: ticket.status }),
      )
    case 'provider':
      assertPermission(actor, ticket, 'provider')
      if (ticket.replacementRequests.some((r) => r.status === 'PENDENTE'))
        throw new ConflictError('Decida a solicitacao pendente antes de trocar o prestador.')
      changes = { provider: provider(action.provider) }
      return repository.mutate(
        ticket,
        changes,
        activity(actor, 'PRESTADOR_ALTERADO', 'Prestador atualizado.', {
          before: ticket.provider,
          after: changes.provider,
        }),
      )
    case 'requestReplacement':
      assertPermission(actor, ticket, 'requestReplacement')
      request = { kind: 'request', actor, reason: reason(action.reason) }
      return repository.mutate(
        ticket,
        {},
        activity(actor, 'TROCA_SOLICITADA', request.reason),
        request,
      )
    case 'approveReplacement':
    case 'rejectReplacement': {
      assertAdmin(actor)
      assertPermission(actor, ticket, 'collaborate')
      const pending = ticket.replacementRequests.find(
        (r) => r.id === action.requestId && r.status === 'PENDENTE',
      )
      if (!pending) throw new ConflictError('Solicitacao inexistente ou ja decidida.')
      const approved = action.action === 'approveReplacement'
      const decisionReason =
        action.action === 'rejectReplacement' ? reason(action.reason) : undefined
      if (action.action === 'approveReplacement') changes = { provider: provider(action.provider) }
      request = { kind: 'decision', actor, approved, requestId: pending.id, reason: decisionReason }
      return repository.mutate(
        ticket,
        changes,
        activity(
          actor,
          'TROCA_DECIDIDA',
          approved ? 'Troca de prestador aprovada.' : decisionReason!,
          {
            requestId: pending.id,
            approved,
            before: ticket.provider,
            after: changes.provider ?? ticket.provider,
          },
        ),
        request,
      )
    }
  }
  event = activity(
    actor,
    'MUDANCA_STATUS',
    action.action === 'contest' ? reason(action.reason) : `Status alterado para ${changes.status}.`,
    { before: ticket.status, after: changes.status },
  )
  return repository.mutate(ticket, changes, event)
}
