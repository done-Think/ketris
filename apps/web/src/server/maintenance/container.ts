import { AddMaintenanceTicketNoteUseCase } from './application/use-cases/add-maintenance-ticket-note.use-case'
import { CreateMaintenanceTicketUseCase } from './application/use-cases/create-maintenance-ticket.use-case'
import { DeleteMaintenanceTicketUseCase } from './application/use-cases/delete-maintenance-ticket.use-case'
import { GetMaintenanceTicketUseCase } from './application/use-cases/get-maintenance-ticket.use-case'
import { ListMaintenanceTicketActivitiesUseCase } from './application/use-cases/list-maintenance-ticket-activities.use-case'
import { ListMaintenanceTicketsUseCase } from './application/use-cases/list-maintenance-tickets.use-case'
import { ResolveMaintenanceTicketUseCase } from './application/use-cases/resolve-maintenance-ticket.use-case'
import { UpdateMaintenanceTicketUseCase } from './application/use-cases/update-maintenance-ticket.use-case'
import { PrismaMaintenanceTicketRepository } from './infrastructure/prisma-maintenance-ticket.repository'

const maintenanceTicketRepository = new PrismaMaintenanceTicketRepository()

export const maintenanceContainer = {
  createMaintenanceTicketUseCase: new CreateMaintenanceTicketUseCase(maintenanceTicketRepository),
  listMaintenanceTicketsUseCase: new ListMaintenanceTicketsUseCase(maintenanceTicketRepository),
  getMaintenanceTicketUseCase: new GetMaintenanceTicketUseCase(maintenanceTicketRepository),
  updateMaintenanceTicketUseCase: new UpdateMaintenanceTicketUseCase(maintenanceTicketRepository),
  deleteMaintenanceTicketUseCase: new DeleteMaintenanceTicketUseCase(maintenanceTicketRepository),
  resolveMaintenanceTicketUseCase: new ResolveMaintenanceTicketUseCase(maintenanceTicketRepository),
  addMaintenanceTicketNoteUseCase: new AddMaintenanceTicketNoteUseCase(maintenanceTicketRepository),
  listMaintenanceTicketActivitiesUseCase: new ListMaintenanceTicketActivitiesUseCase(
    maintenanceTicketRepository,
  ),
}
