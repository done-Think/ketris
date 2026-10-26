import type {
  MaintenanceWorkflowAction,
  MaintenanceWorkflowFormValues,
  MaintenanceWorkflowRequirements,
  MaintenanceWorkflowSelection,
} from '../types/maintenance'
import type { ApiMaintenanceTicket, MaintenanceAction } from '../types/service'

const reasonActions: MaintenanceWorkflowAction[] = [
  'contest',
  'requestReplacement',
  'rejectReplacement',
]

export function maintenanceWorkflowRequirements(
  action: MaintenanceWorkflowAction,
  isRenter: boolean,
): MaintenanceWorkflowRequirements {
  return {
    reason: reasonActions.includes(action) || (action === 'reopen' && isRenter),
    responsible: action === 'assign',
    contract: action === 'linkContract',
    provider: action === 'provider' || action === 'approveReplacement',
  }
}

// Approving a replacement starts from an empty provider; every other action edits the current one.
export function maintenanceWorkflowDefaultValues(
  ticket: ApiMaintenanceTicket,
  action: MaintenanceWorkflowAction,
): MaintenanceWorkflowFormValues {
  const provider = action === 'approveReplacement' ? null : ticket.provider

  return {
    reason: '',
    responsibleId: ticket.responsibleId ?? '',
    contractId: '',
    status: 'ABERTO',
    providerName: provider?.name ?? '',
    providerPhone: provider?.phone ?? '',
    providerEmail: provider?.email ?? '',
    providerNotes: provider?.notes ?? '',
  }
}

export function buildMaintenanceWorkflowAction(
  selection: MaintenanceWorkflowSelection,
  values: MaintenanceWorkflowFormValues,
  isRenter: boolean,
): MaintenanceAction {
  const provider = {
    name: values.providerName,
    phone: values.providerPhone || null,
    email: values.providerEmail || null,
    notes: values.providerNotes || null,
  }

  switch (selection.action) {
    case 'linkContract':
      return { action: 'linkContract', contractId: values.contractId }
    case 'provider':
      return { action: 'provider', provider }
    case 'approveReplacement':
      return { action: 'approveReplacement', requestId: selection.requestId!, provider }
    case 'rejectReplacement':
      return { action: 'rejectReplacement', requestId: selection.requestId!, reason: values.reason }
    case 'contest':
      return { action: 'contest', reason: values.reason }
    case 'requestReplacement':
      return { action: 'requestReplacement', reason: values.reason }
    case 'assign':
      return { action: 'assign', responsibleId: values.responsibleId }
    case 'reopen':
      return isRenter
        ? { action: 'reopen', status: 'ABERTO', reason: values.reason }
        : { action: 'reopen', status: values.status }
    default:
      return { action: selection.action }
  }
}
