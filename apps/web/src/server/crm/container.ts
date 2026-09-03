import { AddOpportunityNoteUseCase } from './application/use-cases/add-opportunity-note.use-case'
import { ArchiveContactUseCase } from './application/use-cases/archive-contact.use-case'
import { ArchiveOpportunityUseCase } from './application/use-cases/archive-opportunity.use-case'
import { CreateContactUseCase } from './application/use-cases/create-contact.use-case'
import { CreateOpportunityUseCase } from './application/use-cases/create-opportunity.use-case'
import { DeleteOpportunityUseCase } from './application/use-cases/delete-opportunity.use-case'
import { GetContactUseCase } from './application/use-cases/get-contact.use-case'
import { GetOpportunityUseCase } from './application/use-cases/get-opportunity.use-case'
import { ListContactsUseCase } from './application/use-cases/list-contacts.use-case'
import { ListOpportunitiesUseCase } from './application/use-cases/list-opportunities.use-case'
import { ListOpportunityActivitiesUseCase } from './application/use-cases/list-opportunity-activities.use-case'
import { RespondToOpportunityUseCase } from './application/use-cases/respond-to-opportunity.use-case'
import { UpdateContactUseCase } from './application/use-cases/update-contact.use-case'
import { UpdateOpportunityUseCase } from './application/use-cases/update-opportunity.use-case'
import { PrismaActivityRepository } from './infrastructure/prisma-activity.repository'
import { PrismaContactRepository } from './infrastructure/prisma-contact.repository'
import { PrismaOpportunityRepository } from './infrastructure/prisma-opportunity.repository'
import { PrismaPropertyLookupRepository } from './infrastructure/prisma-property-lookup.repository'

const opportunityRepository = new PrismaOpportunityRepository()
const contactRepository = new PrismaContactRepository()
const activityRepository = new PrismaActivityRepository()
const propertyLookup = new PrismaPropertyLookupRepository()

export const crmContainer = {
  listOpportunitiesUseCase: new ListOpportunitiesUseCase(opportunityRepository),
  getOpportunityUseCase: new GetOpportunityUseCase(opportunityRepository),
  createOpportunityUseCase: new CreateOpportunityUseCase(
    opportunityRepository,
    contactRepository,
    propertyLookup,
    activityRepository,
  ),
  updateOpportunityUseCase: new UpdateOpportunityUseCase(opportunityRepository, activityRepository),
  respondToOpportunityUseCase: new RespondToOpportunityUseCase(
    opportunityRepository,
    activityRepository,
  ),
  archiveOpportunityUseCase: new ArchiveOpportunityUseCase(opportunityRepository),
  deleteOpportunityUseCase: new DeleteOpportunityUseCase(opportunityRepository),

  listOpportunityActivitiesUseCase: new ListOpportunityActivitiesUseCase(
    opportunityRepository,
    activityRepository,
  ),
  addOpportunityNoteUseCase: new AddOpportunityNoteUseCase(
    opportunityRepository,
    activityRepository,
  ),

  listContactsUseCase: new ListContactsUseCase(contactRepository, opportunityRepository),
  getContactUseCase: new GetContactUseCase(contactRepository),
  createContactUseCase: new CreateContactUseCase(contactRepository),
  updateContactUseCase: new UpdateContactUseCase(contactRepository),
  archiveContactUseCase: new ArchiveContactUseCase(contactRepository),
}
