import type {
  MaintenanceTicketAttachment,
  MaintenanceTicketActivity,
  MaintenanceTicket,
  Contract,
  Property,
  ContractParty,
  ProviderChangeRequest,
  User,
} from '@prisma/client'

export type MaintenanceContractRow = Contract & {
  property: Property
  parties: (ContractParty & { user: Pick<User, 'active' | 'role'> | null })[]
}

export type MaintenanceTicketRow = MaintenanceTicket & {
  property: Property
  contract: MaintenanceContractRow | null
  responsible: Pick<User, 'name'> | null
  activities: MaintenanceTicketActivity[]
  attachments: MaintenanceTicketAttachment[]
  changeRequests: ProviderChangeRequest[]
}

export type MaintenanceContractPartyLink = (
  transaction: import('@prisma/client').Prisma.TransactionClient,
  actor: import('./maintenance-ticket').MaintenanceActor,
  input: { contractId: string; partyId: string; renterId: string },
) => Promise<unknown>
