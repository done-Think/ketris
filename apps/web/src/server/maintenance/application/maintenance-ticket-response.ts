import { permissionsFor } from '../domain/maintenance-access-rules'
import type {
  MaintenanceActor,
  MaintenanceTicket,
  PublicMaintenanceTicket,
} from '../types/maintenance-ticket'

// The only shape a use case hands back: the internal access data never leaves the server and the
// permissions are always computed for the actor who asked.
export function toPublicMaintenanceTicket(
  ticket: MaintenanceTicket,
  actor: MaintenanceActor,
): PublicMaintenanceTicket {
  const visible: Partial<MaintenanceTicket> = { ...ticket }
  delete visible.access

  return {
    ...(visible as Omit<MaintenanceTicket, 'access'>),
    permissions: permissionsFor(actor, ticket),
  }
}
