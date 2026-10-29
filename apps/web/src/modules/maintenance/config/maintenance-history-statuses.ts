import type { MaintenanceStatus } from '../types/maintenance'

export const maintenanceHistoryStatuses = new Map<string, MaintenanceStatus>([
  ['ABERTO', 'open'],
  ['OPEN', 'open'],
  ['EM_ANDAMENTO', 'inProgress'],
  ['IN_PROGRESS', 'inProgress'],
  ['RESOLVIDO', 'resolved'],
  ['RESOLVED', 'resolved'],
  ['FECHADO', 'closed'],
  ['CLOSED', 'closed'],
  ['AGUARDANDO_CONFIRMACAO', 'pendingConfirmation'],
  ['AWAITING_CONFIRMATION', 'pendingConfirmation'],
  ['CONTESTADO', 'contested'],
  ['DISPUTED', 'contested'],
  ['CANCELADO', 'cancelled'],
  ['CANCELED', 'cancelled'],
])
