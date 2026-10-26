import type {
  MaintenanceResponsibleUser,
  MaintenanceUserLinkInput,
} from '../../types/maintenance-ticket'
import type {
  MaintenanceActor,
  MaintenanceActivity,
  MaintenanceAttachment,
  MaintenanceContract,
  MaintenanceMutation,
  MaintenanceOptions,
  MaintenanceRequestMutation,
  MaintenanceTicket,
  MaintenanceTicketListFilters,
  MaintenanceTicketListResult,
  NewMaintenanceActivity,
  NewMaintenanceAttachment,
  NewMaintenanceTicket,
} from '../../types/maintenance-ticket'

export interface MaintenanceTicketRepository {
  findContract(actor: MaintenanceActor, contractId: string): Promise<MaintenanceContract | null>
  findUser(tenantId: string, userId: string): Promise<MaintenanceResponsibleUser | null>
  options(actor: MaintenanceActor): Promise<MaintenanceOptions>
  linkUsers(actor: MaintenanceActor, input: MaintenanceUserLinkInput): Promise<void>
  create(input: NewMaintenanceTicket): Promise<MaintenanceTicket>
  findMany(filters: MaintenanceTicketListFilters): Promise<MaintenanceTicketListResult>
  findById(actor: MaintenanceActor, ticketId: string): Promise<MaintenanceTicket | null>
  findAttachmentTicket(actor: MaintenanceActor, url: string): Promise<MaintenanceTicket | null>
  mutate(
    ticket: MaintenanceTicket,
    changes: MaintenanceMutation,
    activity: NewMaintenanceActivity,
    request?: MaintenanceRequestMutation,
  ): Promise<MaintenanceTicket>
  addNote(ticket: MaintenanceTicket, activity: NewMaintenanceActivity): Promise<MaintenanceActivity>
  addAttachment(
    ticket: MaintenanceTicket,
    attachment: NewMaintenanceAttachment,
  ): Promise<MaintenanceAttachment>
  findActivities(tenantId: string, ticketId: string): Promise<MaintenanceActivity[]>
}
