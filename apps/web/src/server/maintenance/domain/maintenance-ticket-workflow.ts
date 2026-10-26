import { ConflictError, ForbiddenError } from '@server/shared/errors'

import type {
  MaintenanceAction,
  MaintenanceActor,
  MaintenanceMutation,
  MaintenanceProvider,
  MaintenanceTicket,
  NewMaintenanceActivity,
} from '../types/maintenance-ticket'
import type {
  MaintenanceTicketPlan,
  PlannableMaintenanceAction,
} from '../types/maintenance-workflow'
import { assertAdmin, assertPermission } from './maintenance-access-rules'

export function buildActivity(
  actor: MaintenanceActor,
  type: NewMaintenanceActivity['type'],
  message: string,
  details?: Record<string, unknown>,
): NewMaintenanceActivity {
  return { type, message, details, authorId: actor.actorId, authorName: actor.actorName }
}

export function requireReason(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) throw new ConflictError('Informe uma justificativa.')
  return trimmed
}

export function normalizeProvider(value: MaintenanceProvider): MaintenanceProvider {
  if (!value.name.trim()) throw new ConflictError('Informe o nome do prestador.')
  return {
    name: value.name.trim(),
    phone: value.phone?.trim() || null,
    email: value.email?.trim() || null,
    notes: value.notes?.trim() || null,
  }
}

export function isPlannableAction(action: MaintenanceAction): action is PlannableMaintenanceAction {
  return !['linkContract', 'assume', 'assign'].includes(action.action)
}

function statusChange(
  actor: MaintenanceActor,
  ticket: MaintenanceTicket,
  changes: MaintenanceMutation,
  message = `Status alterado para ${changes.status}.`,
): MaintenanceTicketPlan {
  return {
    changes,
    activity: buildActivity(actor, 'MUDANCA_STATUS', message, {
      before: ticket.status,
      after: changes.status,
    }),
  }
}

// Pure decision for every action that needs nothing but the ticket and the actor: checks the
// permission, validates the input and returns the changes plus the audit activity to persist.
export function planTicketAction(
  ticket: MaintenanceTicket,
  actor: MaintenanceActor,
  action: PlannableMaintenanceAction,
  now: Date = new Date(),
): MaintenanceTicketPlan {
  switch (action.action) {
    case 'schedule': {
      assertPermission(actor, ticket, 'schedule')
      const scheduledAt = new Date(action.scheduledAt)
      if (Number.isNaN(scheduledAt.getTime()))
        throw new ConflictError('Informe uma data de atendimento valida.')
      return {
        changes: { scheduledAt },
        activity: buildActivity(actor, 'EDICAO', 'Atendimento agendado com o prestador.', {
          before: { scheduledAt: ticket.scheduledAt?.toISOString() ?? null },
          after: { scheduledAt: scheduledAt.toISOString() },
          provider: ticket.provider?.name,
        }),
      }
    }
    case 'finish': {
      assertPermission(actor, ticket, 'finish')
      return {
        changes: {
          status: 'RESOLVIDO',
          resolvedAt: now,
          completedByRole: actor.actorPapel,
          completedById: actor.actorId,
        },
        activity: buildActivity(actor, 'MUDANCA_STATUS', 'Chamado finalizado pelo locatário.', {
          before: ticket.status,
          after: 'RESOLVIDO',
          resolvedAt: now.toISOString(),
          previousCompletionRole: ticket.completedByRole,
        }),
      }
    }
    case 'start':
      assertPermission(actor, ticket, 'start')
      return statusChange(actor, ticket, { status: 'EM_ANDAMENTO' })
    case 'complete':
      assertPermission(actor, ticket, 'complete')
      if (!ticket.contractId)
        throw new ConflictError('Regularize o contrato antes de concluir o chamado.')
      return statusChange(actor, ticket, {
        status: 'AGUARDANDO_CONFIRMACAO',
        completedByRole: actor.actorPapel,
        completedById: actor.actorId,
      })
    case 'confirm':
      assertPermission(actor, ticket, 'confirm')
      return statusChange(actor, ticket, { status: 'RESOLVIDO', resolvedAt: now })
    case 'contest':
      assertPermission(actor, ticket, 'contest')
      return statusChange(
        actor,
        ticket,
        { status: 'CONTESTADO', resolvedAt: null },
        requireReason(action.reason),
      )
    case 'cancel':
      assertPermission(actor, ticket, 'cancel')
      return statusChange(actor, ticket, { status: 'CANCELADO', resolvedAt: null })
    case 'reopen': {
      assertPermission(actor, ticket, 'reopen')
      if (!['ABERTO', 'EM_ANDAMENTO'].includes(action.status))
        throw new ConflictError('Status de reabertura invalido.')
      if (actor.actorPapel === 'RENTER' && action.status !== 'ABERTO')
        throw new ForbiddenError('O locatario pode reabrir o chamado somente como aberto.')
      const reopenReason =
        actor.actorPapel === 'RENTER' || action.reason !== undefined
          ? requireReason(action.reason ?? '')
          : null
      const changes: MaintenanceMutation = {
        status: action.status,
        resolvedAt: null,
        completedById: null,
        completedByRole: null,
      }
      return {
        changes,
        activity: buildActivity(actor, 'MUDANCA_STATUS', reopenReason ?? 'Chamado reaberto.', {
          before: ticket.status,
          after: changes.status,
          reason: reopenReason,
          previousResolution: {
            resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
            completedByRole: ticket.completedByRole,
          },
        }),
      }
    }
    case 'restore':
      assertPermission(actor, ticket, 'restore')
      return {
        changes: { deletedAt: null, deletedById: null },
        activity: buildActivity(actor, 'RESTAURACAO', 'Chamado restaurado.', {
          status: ticket.status,
        }),
      }
    case 'provider': {
      assertPermission(actor, ticket, 'provider')
      if (ticket.replacementRequests.some((r) => r.status === 'PENDENTE'))
        throw new ConflictError('Decida a solicitacao pendente antes de trocar o prestador.')
      const provider = normalizeProvider(action.provider)
      return {
        changes: { provider },
        activity: buildActivity(actor, 'PRESTADOR_ALTERADO', 'Prestador atualizado.', {
          before: ticket.provider,
          after: provider,
        }),
      }
    }
    case 'requestReplacement': {
      assertPermission(actor, ticket, 'requestReplacement')
      const reason = requireReason(action.reason)
      return {
        changes: {},
        activity: buildActivity(actor, 'TROCA_SOLICITADA', reason),
        request: { kind: 'request', actor, reason },
      }
    }
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
        action.action === 'rejectReplacement' ? requireReason(action.reason) : undefined
      const changes: MaintenanceMutation =
        action.action === 'approveReplacement'
          ? { provider: normalizeProvider(action.provider) }
          : {}
      return {
        changes,
        activity: buildActivity(
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
        request: {
          kind: 'decision',
          actor,
          approved,
          requestId: pending.id,
          reason: decisionReason,
        },
      }
    }
  }
}
