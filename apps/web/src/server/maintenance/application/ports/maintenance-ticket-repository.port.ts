import type {
  MaintenanceActivity,
  MaintenanceAttachment,
  MaintenanceProperty,
  MaintenanceTicket,
  MaintenanceTicketListFilters,
  MaintenanceTicketListResult,
  MaintenanceTicketUpdate,
  NewMaintenanceActivity,
  NewMaintenanceAttachment,
  NewMaintenanceTicket,
} from '../../domain/maintenance-ticket.entity'

export interface MaintenanceTicketRepository {
  findPropertyForTenant(tenantId: string, propertyId: string): Promise<MaintenanceProperty | null>
  create(input: NewMaintenanceTicket): Promise<MaintenanceTicket>
  findMany(filters: MaintenanceTicketListFilters): Promise<MaintenanceTicketListResult>
  findById(tenantId: string, ticketId: string): Promise<MaintenanceTicket | null>
  update(
    tenantId: string,
    ticketId: string,
    changes: MaintenanceTicketUpdate,
  ): Promise<MaintenanceTicket>
  delete(tenantId: string, ticketId: string): Promise<void>
  resolve(
    tenantId: string,
    ticketId: string,
    activity: NewMaintenanceActivity,
  ): Promise<MaintenanceTicket>
  addNote(
    tenantId: string,
    ticketId: string,
    activity: NewMaintenanceActivity,
  ): Promise<MaintenanceActivity>
  addAttachment(
    tenantId: string,
    ticketId: string,
    attachment: NewMaintenanceAttachment,
  ): Promise<MaintenanceAttachment>
  findActivities(tenantId: string, ticketId: string): Promise<MaintenanceActivity[]>
}
