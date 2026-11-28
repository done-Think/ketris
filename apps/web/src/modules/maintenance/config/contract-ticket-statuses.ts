import type { MaintenanceStatus } from '../types/maintenance'

export const finishedContractTicketStatuses: ReadonlySet<MaintenanceStatus> = new Set([
  'resolved',
  'closed',
  'cancelled',
])
