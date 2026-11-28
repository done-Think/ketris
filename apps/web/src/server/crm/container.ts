import 'server-only'

import { StartContactInteractionUseCase } from './application/use-cases/start-contact-interaction.use-case'
import { LinkLeadContactUseCase } from './application/use-cases/link-lead-contact.use-case'
import { PrismaLeadContactLinkRepository } from './infrastructure/prisma-lead-contact-link.repository'
import { PrismaInteractionRepository } from './infrastructure/prisma-interaction.repository'
import { StartLeadInteractionUseCase } from './application/use-cases/start-lead-interaction.use-case'
import { CompleteInteractionUseCase } from './application/use-cases/complete-interaction.use-case'
import { ListInteractionsUseCase } from './application/use-cases/list-interactions.use-case'
import { AddOpportunityNoteUseCase } from './application/use-cases/add-opportunity-note.use-case'
import { ListOpportunityResponsiblesUseCase } from './application/use-cases/list-opportunity-responsibles.use-case'
import { AssignOpportunityResponsibleUseCase } from './application/use-cases/assign-opportunity-responsible.use-case'
import { ArchiveContactUseCase } from './application/use-cases/archive-contact.use-case'
import { ArchiveOpportunityUseCase } from './application/use-cases/archive-opportunity.use-case'
import { ConvertLeadToOpportunityUseCase } from './application/use-cases/convert-lead-to-opportunity.use-case'
import { CreateContactUseCase } from './application/use-cases/create-contact.use-case'
import { CreateLeadUseCase } from './application/use-cases/create-lead.use-case'
import { CreateOpportunityUseCase } from './application/use-cases/create-opportunity.use-case'
import { DeleteOpportunityUseCase } from './application/use-cases/delete-opportunity.use-case'
import { GetContactUseCase } from './application/use-cases/get-contact.use-case'
import { GetCrmPropertyUseCase } from './application/use-cases/get-crm-property.use-case'
import { GetLeadUseCase } from './application/use-cases/get-lead.use-case'
import { GetOpportunityUseCase } from './application/use-cases/get-opportunity.use-case'
import { ListContactsUseCase } from './application/use-cases/list-contacts.use-case'
import { ListCrmPropertiesUseCase } from './application/use-cases/list-crm-properties.use-case'
import { ListLeadsUseCase } from './application/use-cases/list-leads.use-case'
import { ListOpportunitiesUseCase } from './application/use-cases/list-opportunities.use-case'
import { ListOpportunityActivitiesUseCase } from './application/use-cases/list-opportunity-activities.use-case'
import { RespondToOpportunityUseCase } from './application/use-cases/respond-to-opportunity.use-case'
import { UpdateContactUseCase } from './application/use-cases/update-contact.use-case'
import { UpdateLeadUseCase } from './application/use-cases/update-lead.use-case'
import { UpdateOpportunityUseCase } from './application/use-cases/update-opportunity.use-case'
import { PrismaActivityRepository } from './infrastructure/prisma-activity.repository'
import { PrismaContactRepository } from './infrastructure/prisma-contact.repository'
import { PrismaCrmPropertyCatalog } from './infrastructure/prisma-crm-property-catalog'
import { PrismaLeadRepository } from './infrastructure/prisma-lead.repository'
import { PrismaOpportunityRepository } from './infrastructure/prisma-opportunity.repository'
import { PrismaPropertyLookupRepository } from './infrastructure/prisma-property-lookup.repository'
import { PrismaResponsibleLookup } from './infrastructure/prisma-responsible-lookup'

import { prisma } from '@server/db/prisma'
import { runCrmMutation } from './infrastructure/run-crm-mutation'
import type { CrmDatabase, CrmScope, CrmUseCase } from './types/prisma'

function buildUseCases(db: CrmDatabase, scope: CrmScope) {
  const opportunityRepository = new PrismaOpportunityRepository(db, scope)
  const contactRepository = new PrismaContactRepository(db, scope)
  const activityRepository = new PrismaActivityRepository(db, scope)
  const propertyLookup = new PrismaPropertyLookupRepository(db)
  const leadRepository = new PrismaLeadRepository(db, scope)
  const responsibleLookup = new PrismaResponsibleLookup(db)

  const interactionRepository = new PrismaInteractionRepository(db, scope)
  return {
    linkLeadContactUseCase: new LinkLeadContactUseCase(
      leadRepository,
      new PrismaLeadContactLinkRepository(db, scope),
      new GetContactUseCase(contactRepository, opportunityRepository),
      new CreateContactUseCase(contactRepository),
    ),
    startContactInteractionUseCase: new StartContactInteractionUseCase(
      interactionRepository,
      new GetContactUseCase(contactRepository, opportunityRepository),
    ),
    startLeadInteractionUseCase: new StartLeadInteractionUseCase(
      interactionRepository,
      leadRepository,
    ),
    completeInteractionUseCase: new CompleteInteractionUseCase(interactionRepository),
    listInteractionsUseCase: new ListInteractionsUseCase(
      interactionRepository,
      leadRepository,
      new GetContactUseCase(contactRepository, opportunityRepository),
      new GetOpportunityUseCase(opportunityRepository),
    ),
    listCrmPropertiesUseCase: new ListCrmPropertiesUseCase(new PrismaCrmPropertyCatalog(db, scope)),
    getCrmPropertyUseCase: new GetCrmPropertyUseCase(new PrismaCrmPropertyCatalog(db, scope)),
    listOpportunitiesUseCase: new ListOpportunitiesUseCase(opportunityRepository),
    getOpportunityUseCase: new GetOpportunityUseCase(opportunityRepository),
    createOpportunityUseCase: new CreateOpportunityUseCase(
      opportunityRepository,
      contactRepository,
      propertyLookup,
      activityRepository,
      responsibleLookup,
    ),
    listOpportunityResponsiblesUseCase: new ListOpportunityResponsiblesUseCase(responsibleLookup),
    assignOpportunityResponsibleUseCase: new AssignOpportunityResponsibleUseCase(
      opportunityRepository,
      responsibleLookup,
      activityRepository,
    ),
    updateOpportunityUseCase: new UpdateOpportunityUseCase(
      opportunityRepository,
      activityRepository,
      contactRepository,
    ),
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
    getContactUseCase: new GetContactUseCase(contactRepository, opportunityRepository),
    createContactUseCase: new CreateContactUseCase(contactRepository),
    updateContactUseCase: new UpdateContactUseCase(
      contactRepository,
      opportunityRepository,
      leadRepository,
    ),
    archiveContactUseCase: new ArchiveContactUseCase(contactRepository, opportunityRepository),

    createLeadUseCase: new CreateLeadUseCase(leadRepository, propertyLookup, contactRepository),
    listLeadsUseCase: new ListLeadsUseCase(leadRepository),
    getLeadUseCase: new GetLeadUseCase(leadRepository),
    updateLeadUseCase: new UpdateLeadUseCase(leadRepository),
    convertLeadToOpportunityUseCase: new ConvertLeadToOpportunityUseCase(
      leadRepository,
      opportunityRepository,
      propertyLookup,
    ),
  }
}

function scopedUseCase<Input extends CrmScope, Output>(
  select: (cases: ReturnType<typeof buildUseCases>) => CrmUseCase<Input, Output>,
  mutation = false,
): CrmUseCase<Input, Output> {
  return {
    execute(input) {
      const execute = (db: CrmDatabase) => select(buildUseCases(db, input)).execute(input)
      return mutation
        ? runCrmMutation(input, execute)
        : prisma.$transaction(execute, { isolationLevel: 'RepeatableRead' })
    },
  }
}

export const crmContainer = {
  linkLeadContactUseCase: scopedUseCase((cases) => cases.linkLeadContactUseCase, true),
  startContactInteractionUseCase: scopedUseCase(
    (cases) => cases.startContactInteractionUseCase,
    true,
  ),
  startLeadInteractionUseCase: scopedUseCase((cases) => cases.startLeadInteractionUseCase, true),
  completeInteractionUseCase: scopedUseCase((cases) => cases.completeInteractionUseCase, true),
  listInteractionsUseCase: scopedUseCase((cases) => cases.listInteractionsUseCase),
  listCrmPropertiesUseCase: scopedUseCase((cases) => cases.listCrmPropertiesUseCase),
  getCrmPropertyUseCase: scopedUseCase((cases) => cases.getCrmPropertyUseCase),
  listOpportunitiesUseCase: scopedUseCase((cases) => cases.listOpportunitiesUseCase),
  getOpportunityUseCase: scopedUseCase((cases) => cases.getOpportunityUseCase),
  createOpportunityUseCase: scopedUseCase((cases) => cases.createOpportunityUseCase, true),
  updateOpportunityUseCase: scopedUseCase((cases) => cases.updateOpportunityUseCase, true),
  listOpportunityResponsiblesUseCase: scopedUseCase(
    (cases) => cases.listOpportunityResponsiblesUseCase,
  ),
  assignOpportunityResponsibleUseCase: scopedUseCase(
    (cases) => cases.assignOpportunityResponsibleUseCase,
    true,
  ),
  respondToOpportunityUseCase: scopedUseCase((cases) => cases.respondToOpportunityUseCase, true),
  archiveOpportunityUseCase: scopedUseCase((cases) => cases.archiveOpportunityUseCase, true),
  deleteOpportunityUseCase: scopedUseCase((cases) => cases.deleteOpportunityUseCase, true),
  listOpportunityActivitiesUseCase: scopedUseCase(
    (cases) => cases.listOpportunityActivitiesUseCase,
  ),
  addOpportunityNoteUseCase: scopedUseCase((cases) => cases.addOpportunityNoteUseCase, true),
  listContactsUseCase: scopedUseCase((cases) => cases.listContactsUseCase),
  getContactUseCase: scopedUseCase((cases) => cases.getContactUseCase),
  createContactUseCase: scopedUseCase((cases) => cases.createContactUseCase, true),
  updateContactUseCase: scopedUseCase((cases) => cases.updateContactUseCase, true),
  archiveContactUseCase: scopedUseCase((cases) => cases.archiveContactUseCase, true),
  createLeadUseCase: scopedUseCase((cases) => cases.createLeadUseCase, true),
  listLeadsUseCase: scopedUseCase((cases) => cases.listLeadsUseCase),
  getLeadUseCase: scopedUseCase((cases) => cases.getLeadUseCase),
  updateLeadUseCase: scopedUseCase((cases) => cases.updateLeadUseCase, true),
  convertLeadToOpportunityUseCase: scopedUseCase(
    (cases) => cases.convertLeadToOpportunityUseCase,
    true,
  ),
}
