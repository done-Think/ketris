import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { maintenanceActionActivityCodes } from '../constants/maintenance-system-actions'
import type { MaintenanceActionPlan } from '../types/maintenance-action-plan'
import type {
  MaintenanceAction,
  MaintenanceActor,
  MaintenanceMutation,
  MaintenanceRequestMutation,
  MaintenanceTicket,
  NewMaintenanceActivity,
} from '../types/maintenance-ticket'
import { activity, provider, reason } from './maintenance-activity'
import { assertAdmin, assertCanDefineProvider, assertPermission } from './maintenance-policy'

function plan(
  changes: MaintenanceMutation,
  activity: NewMaintenanceActivity,
  request?: MaintenanceRequestMutation,
): MaintenanceActionPlan {
  return { changes, activity, request }
}

export function planMaintenanceAction(
  actor: MaintenanceActor,
  ticket: MaintenanceTicket,
  action: MaintenanceAction,
): MaintenanceActionPlan {
  const actionActivity = (
    type: NewMaintenanceActivity['type'],
    message: string,
    details?: Record<string, unknown>,
  ): NewMaintenanceActivity => ({
    ...activity(actor, type, message, details),
    systemAction: maintenanceActionActivityCodes[action.action],
  })
  let changes: MaintenanceMutation = {}
  let event: NewMaintenanceActivity
  let request: MaintenanceRequestMutation | undefined
  switch (action.action) {
    case 'linkContract': {
      assertAdmin(actor)
      return plan(
        { contractId: action.contractId },
        actionActivity('EDICAO', 'Contrato do chamado associado pelo administrador.', {
          before: { contractId: ticket.contractId, propertyId: ticket.propertyId },
          after: { contractId: action.contractId, propertyId: ticket.propertyId },
        }),
      )
    }
    case 'schedule': {
      assertPermission(actor, ticket, 'schedule')
      const scheduledAt = new Date(action.scheduledAt)
      if (Number.isNaN(scheduledAt.getTime()))
        throw new ConflictError('Informe uma data de atendimento valida.')
      return plan(
        { scheduledAt },
        actionActivity('EDICAO', 'Atendimento agendado com o prestador.', {
          before: { scheduledAt: ticket.scheduledAt?.toISOString() ?? null },
          after: { scheduledAt: scheduledAt.toISOString() },
          provider: ticket.provider?.name,
        }),
      )
    }
    case 'finish': {
      assertPermission(actor, ticket, 'finish')
      const resolvedAt = new Date()
      return plan(
        {
          status: 'RESOLVIDO',
          resolvedAt,
          completedByRole: actor.actorPapel,
          completedById: actor.actorId,
        },
        actionActivity('MUDANCA_STATUS', 'Chamado finalizado pelo locatário.', {
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
      return plan(
        changes,
        actionActivity('MUDANCA_STATUS', reopenReason ?? 'Chamado reaberto.', {
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
      changes = { responsibleId }
      event = actionActivity('RESPONSAVEL_ALTERADO', 'Responsavel interno atualizado.', {
        before: ticket.responsibleId,
        after: responsibleId,
      })
      return plan(changes, event)
    }
    case 'restore':
      assertPermission(actor, ticket, 'restore')
      return plan(
        { deletedAt: null, deletedById: null },
        actionActivity('RESTAURACAO', 'Chamado restaurado.', { status: ticket.status }),
      )
    case 'provider':
      assertCanDefineProvider(actor, ticket)
      changes = { provider: provider(action.provider) }
      return plan(
        changes,
        actionActivity('PRESTADOR_ALTERADO', 'Prestador atualizado.', {
          before: ticket.provider,
          after: changes.provider,
        }),
      )
    case 'requestReplacement':
      assertPermission(actor, ticket, 'requestReplacement')
      request = { kind: 'request', actor, reason: reason(action.reason) }
      return plan({}, actionActivity('TROCA_SOLICITADA', request.reason), request)
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
      return plan(
        changes,
        actionActivity(
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
  event = actionActivity(
    'MUDANCA_STATUS',
    action.action === 'contest' ? reason(action.reason) : `Status alterado para ${changes.status}.`,
    { before: ticket.status, after: changes.status },
  )
  return plan(changes, event)
}
