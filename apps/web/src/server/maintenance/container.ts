import { contractsContainer } from '@server/contracts/container'

import { ActOnMaintenanceTicketUseCase } from './application/use-cases/act-on-maintenance-ticket.use-case'
import { AddMaintenanceTicketNoteUseCase } from './application/use-cases/add-maintenance-ticket-note.use-case'
import { CreateMaintenanceTicketUseCase } from './application/use-cases/create-maintenance-ticket.use-case'
import { DeleteMaintenanceTicketUseCase } from './application/use-cases/delete-maintenance-ticket.use-case'
import { GetMaintenanceAttachmentUseCase } from './application/use-cases/get-maintenance-attachment.use-case'
import { GetMaintenanceOptionsUseCase } from './application/use-cases/get-maintenance-options.use-case'
import { GetMaintenanceTicketUseCase } from './application/use-cases/get-maintenance-ticket.use-case'
import { LinkMaintenanceUsersUseCase } from './application/use-cases/link-maintenance-users.use-case'
import { ListMaintenanceTicketActivitiesUseCase } from './application/use-cases/list-maintenance-ticket-activities.use-case'
import { ListMaintenanceTicketsUseCase } from './application/use-cases/list-maintenance-tickets.use-case'
import { ResolveMaintenanceTicketUseCase } from './application/use-cases/resolve-maintenance-ticket.use-case'
import { UpdateMaintenanceTicketUseCase } from './application/use-cases/update-maintenance-ticket.use-case'
import { UploadMaintenanceTicketAttachmentUseCase } from './application/use-cases/upload-maintenance-ticket-attachment.use-case'
import { PrismaMaintenanceTicketRepository } from './infrastructure/prisma-maintenance-ticket.repository'
import { S3MaintenanceAttachmentStorage } from './infrastructure/s3-maintenance-attachment-storage'

// The contract-party link rule belongs to contracts; maintenance only receives it here.
const maintenanceTicketRepository = new PrismaMaintenanceTicketRepository((tx) =>
  contractsContainer.createContractPartyLinkUseCase(tx),
)
const maintenanceAttachmentStorage = new S3MaintenanceAttachmentStorage()

export const maintenanceContainer = {
  repository: maintenanceTicketRepository,
  createMaintenanceTicketUseCase: new CreateMaintenanceTicketUseCase(maintenanceTicketRepository),
  listMaintenanceTicketsUseCase: new ListMaintenanceTicketsUseCase(maintenanceTicketRepository),
  getMaintenanceTicketUseCase: new GetMaintenanceTicketUseCase(maintenanceTicketRepository),
  updateMaintenanceTicketUseCase: new UpdateMaintenanceTicketUseCase(maintenanceTicketRepository),
  deleteMaintenanceTicketUseCase: new DeleteMaintenanceTicketUseCase(maintenanceTicketRepository),
  resolveMaintenanceTicketUseCase: new ResolveMaintenanceTicketUseCase(maintenanceTicketRepository),
  actOnMaintenanceTicketUseCase: new ActOnMaintenanceTicketUseCase(maintenanceTicketRepository),
  addMaintenanceTicketNoteUseCase: new AddMaintenanceTicketNoteUseCase(maintenanceTicketRepository),
  listMaintenanceTicketActivitiesUseCase: new ListMaintenanceTicketActivitiesUseCase(
    maintenanceTicketRepository,
  ),
  getMaintenanceOptionsUseCase: new GetMaintenanceOptionsUseCase(maintenanceTicketRepository),
  linkMaintenanceUsersUseCase: new LinkMaintenanceUsersUseCase(maintenanceTicketRepository),
  uploadMaintenanceTicketAttachmentUseCase: new UploadMaintenanceTicketAttachmentUseCase(
    maintenanceTicketRepository,
    maintenanceAttachmentStorage,
  ),
  getMaintenanceAttachmentUseCase: new GetMaintenanceAttachmentUseCase(
    maintenanceTicketRepository,
    maintenanceAttachmentStorage,
  ),
}
