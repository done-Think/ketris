import { permissionsFor } from '../domain/maintenance-policy'
import type { MaintenanceActor, MaintenanceTicket } from '../types/maintenance-ticket'

export function publicTicket({ access, ...ticket }: MaintenanceTicket, actor: MaintenanceActor) {
  return { ...ticket, permissions: permissionsFor(actor, { ...ticket, access }) }
}
