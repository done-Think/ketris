import { ConflictError, ForbiddenError } from '@server/shared/errors'

import { MaintenancePropertyNotFoundError } from '../domain/errors'
import {
  assertAdmin,
  assertPermission,
  assertTicketAccess,
  canAccessContract,
  permissionsFor,
} from '../domain/maintenance-access-rules'
import {
  buildActivity,
  isPlannableAction,
  planTicketAction,
} from '../domain/maintenance-ticket-workflow'
import type {
  MaintenanceAction,
  MaintenanceActor,
  MaintenanceTicket,
  MaintenanceTicketUpdate,
} from '../types/maintenance-ticket'
import type { MaintenanceTicketRepository } from './ports/maintenance-ticket-repository.port'

// Orchestration shared by the use cases: loads what a decision needs, asks the domain for the
// decision and persists it. The rules themselves live in domain/.

export async function loadTicket(
  repository: MaintenanceTicketRepository,
  actor: MaintenanceActor,
  ticketId: string,
) {
  const ticket = await repository.findById(actor, ticketId)
  assertTicketAccess(actor, ticket)
  return { ...ticket, permissions: permissionsFor(actor, ticket) }
}

export async function validateContract(
  repository: MaintenanceTicketRepository,
  actor: MaintenanceActor,
  contractId: string,
  propertyId?: string,
) {
  const contract = await repository.findContract(actor, contractId)
  if (
    !contract ||
    (propertyId && propertyId !== contract.propertyId) ||
    !canAccessContract(actor, contract)
  ) {
    throw new MaintenancePropertyNotFoundError()
  }
  return contract
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
    if (actor.actorPapel === 'RENTER') throw new ForbiddenError()
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
    buildActivity(actor, 'EDICAO', 'Dados do chamado atualizados.', {
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
    buildActivity(actor, 'EXCLUSAO', 'Chamado arquivado.', { status: ticket.status }),
  )
}

export async function actOnTicket(
  repository: MaintenanceTicketRepository,
  actor: MaintenanceActor,
  ticketId: string,
  action: MaintenanceAction,
) {
  const ticket = await loadTicket(repository, actor, ticketId)

  if (isPlannableAction(action)) {
    const plan = planTicketAction(ticket, actor, action)
    return plan.request
      ? repository.mutate(ticket, plan.changes, plan.activity, plan.request)
      : repository.mutate(ticket, plan.changes, plan.activity)
  }

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
        buildActivity(actor, 'EDICAO', 'Contrato do chamado associado pelo administrador.', {
          before: { contractId: ticket.contractId, propertyId: ticket.propertyId },
          after: { contractId: contract.id, propertyId: ticket.propertyId },
        }),
      )
    }
    case 'assume':
    case 'assign': {
      assertPermission(actor, ticket, action.action)
      const responsibleId = action.action === 'assume' ? actor.actorId : action.responsibleId
      const user = await repository.findUser(actor.actorTenantId, responsibleId)
      if (!user || !['OWNER', 'AGENT', 'PROPERTY_OWNER'].includes(user.role))
        throw new ForbiddenError('Responsavel invalido para esta corretora.')
      return repository.mutate(
        ticket,
        { responsibleId },
        buildActivity(actor, 'RESPONSAVEL_ALTERADO', 'Responsavel interno atualizado.', {
          before: ticket.responsibleId,
          after: responsibleId,
        }),
      )
    }
  }
}
