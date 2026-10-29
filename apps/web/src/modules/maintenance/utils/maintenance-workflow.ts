import type { MaintenanceWorkflowSelection } from '../types/maintenance'
import type { MaintenanceWorkflowFormValues } from '../types/maintenance-workflow'
import type { MaintenanceAction } from '../types/service'

export function buildMaintenanceWorkflowAction(
  values: MaintenanceWorkflowFormValues,
  selection: MaintenanceWorkflowSelection,
  role?: string,
): MaintenanceAction {
  const provider = values.catalogProvider
    ? { id: values.catalogProvider.id }
    : {
        name: values.name,
        phone: values.phone || null,
        email: values.email || null,
        notes: values.notes || null,
      }
  switch (selection.action) {
    case 'linkContract':
      return { action: 'linkContract', contractId: values.contractId }
    case 'assign':
      return { action: 'assign', responsibleId: values.responsibleId }
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
    case 'reopen':
      return role === 'RENTER'
        ? { action: 'reopen', status: 'OPEN', reason: values.reason }
        : { action: 'reopen', status: values.status }
    default:
      return { action: selection.action }
  }
}
