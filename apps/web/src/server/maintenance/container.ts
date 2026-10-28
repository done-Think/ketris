import { contractsContainer } from '@server/contracts/container'
import { randomUUID } from 'node:crypto'
import { ActOnMaintenanceTicketUseCase } from './application/use-cases/act-on-maintenance-ticket.use-case'
import { AddMaintenanceTicketNoteUseCase } from './application/use-cases/add-maintenance-ticket-note.use-case'
import { CompleteMaintenanceAttachmentUploadUseCase } from './application/use-cases/complete-maintenance-attachment-upload.use-case'
import { CreateMaintenanceProviderUseCase } from './application/use-cases/create-maintenance-provider.use-case'
import { CreateMaintenanceTicketUseCase } from './application/use-cases/create-maintenance-ticket.use-case'
import { DeleteMaintenanceTicketUseCase } from './application/use-cases/delete-maintenance-ticket.use-case'
import { GetMaintenanceAttachmentUseCase } from './application/use-cases/get-maintenance-attachment.use-case'
import { GetMaintenanceTicketUseCase } from './application/use-cases/get-maintenance-ticket.use-case'
import { ListMaintenanceOptionsUseCase } from './application/use-cases/list-maintenance-options.use-case'
import { ListMaintenanceProvidersUseCase } from './application/use-cases/list-maintenance-providers.use-case'
import { ListMaintenanceTicketActivitiesUseCase } from './application/use-cases/list-maintenance-ticket-activities.use-case'
import { ListMaintenanceTicketsUseCase } from './application/use-cases/list-maintenance-tickets.use-case'
import { PrepareMaintenanceAttachmentUploadUseCase } from './application/use-cases/prepare-maintenance-attachment-upload.use-case'
import { RegularizeMaintenanceLinksUseCase } from './application/use-cases/regularize-maintenance-links.use-case'
import { ResolveMaintenanceTicketUseCase } from './application/use-cases/resolve-maintenance-ticket.use-case'
import { UpdateMaintenanceProviderUseCase } from './application/use-cases/update-maintenance-provider.use-case'
import { UpdateMaintenanceTicketUseCase } from './application/use-cases/update-maintenance-ticket.use-case'
import { UploadMaintenanceTicketAttachmentUseCase } from './application/use-cases/upload-maintenance-ticket-attachment.use-case'
import { JoseMaintenanceUploadTickets } from './infrastructure/jose-maintenance-upload-tickets'
import { PrismaMaintenanceProviderRepository } from './infrastructure/prisma-maintenance-provider.repository'
import { PrismaMaintenanceTicketRepository } from './infrastructure/prisma-maintenance-ticket.repository'
import { S3MaintenanceAttachmentStorage } from './infrastructure/s3-maintenance-attachment-storage'

const maintenanceTicketRepository = new PrismaMaintenanceTicketRepository(
  (transaction, actor, input) =>
    contractsContainer.createContractPartyLinkUseCase(transaction).execute({
      actorTenantId: actor.actorTenantId,
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      contractId: input.contractId,
      partyId: input.partyId,
      userId: input.renterId,
    }),
)
const maintenanceProviderRepository = new PrismaMaintenanceProviderRepository()
const maintenanceAttachmentStorage = new S3MaintenanceAttachmentStorage()

const maintenanceUploadTickets = new JoseMaintenanceUploadTickets()

export const maintenanceContainer = {
  prepareMaintenanceAttachmentUploadUseCase: new PrepareMaintenanceAttachmentUploadUseCase(
    maintenanceTicketRepository,
    maintenanceAttachmentStorage,
    maintenanceUploadTickets,
    { generate: randomUUID },
  ),
  completeMaintenanceAttachmentUploadUseCase: new CompleteMaintenanceAttachmentUploadUseCase(
    maintenanceTicketRepository,
    maintenanceAttachmentStorage,
    maintenanceUploadTickets,
  ),
  listMaintenanceProvidersUseCase: new ListMaintenanceProvidersUseCase(
    maintenanceProviderRepository,
    maintenanceTicketRepository,
  ),
  createMaintenanceProviderUseCase: new CreateMaintenanceProviderUseCase(
    maintenanceProviderRepository,
    maintenanceTicketRepository,
  ),
  updateMaintenanceProviderUseCase: new UpdateMaintenanceProviderUseCase(
    maintenanceProviderRepository,
  ),
  getMaintenanceAttachmentUseCase: new GetMaintenanceAttachmentUseCase(
    maintenanceTicketRepository,
    maintenanceAttachmentStorage,
  ),
  actOnMaintenanceTicketUseCase: new ActOnMaintenanceTicketUseCase(maintenanceTicketRepository),
  listMaintenanceOptionsUseCase: new ListMaintenanceOptionsUseCase(maintenanceTicketRepository),
  regularizeMaintenanceLinksUseCase: new RegularizeMaintenanceLinksUseCase(
    maintenanceTicketRepository,
  ),
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
  uploadMaintenanceTicketAttachmentUseCase: new UploadMaintenanceTicketAttachmentUseCase(
    maintenanceTicketRepository,
    maintenanceAttachmentStorage,
  ),
}
