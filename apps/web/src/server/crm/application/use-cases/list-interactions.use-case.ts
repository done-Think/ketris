import type {
  ListInteractionsInput,
  ListInteractionsOutput,
} from '../../types/list-interactions.use-case.types'
export type {
  ListInteractionsInput,
  ListInteractionsOutput,
} from '../../types/list-interactions.use-case.types'

import { LeadNotFoundError } from '../../domain/errors'
import type { CrmUseCase } from '../../types/prisma'
import type { GetContactInput, GetContactOutput } from '../../types/get-contact.use-case.types'
import type {
  GetOpportunityInput,
  GetOpportunityOutput,
} from '../../types/get-opportunity.use-case.types'
import { assertCrmAccess, assertLeadAccess } from '../authorization'
import type { InteractionRepository } from '../ports/interaction-repository.port'
import type { LeadRepository } from '../ports/lead-repository.port'

export class ListInteractionsUseCase {
  constructor(
    private readonly repository: InteractionRepository,
    private readonly leads: LeadRepository,
    private readonly contacts: CrmUseCase<GetContactInput, GetContactOutput>,
    private readonly opportunities: CrmUseCase<GetOpportunityInput, GetOpportunityOutput>,
  ) {}

  async execute(input: ListInteractionsInput): Promise<ListInteractionsOutput> {
    assertCrmAccess(input.actorRole)
    const id = input.target.id
    if (input.target.kind === 'lead') {
      const lead = await this.leads.findById(id)
      if (!lead || lead.tenantId !== input.actorTenantId) throw new LeadNotFoundError()
      assertLeadAccess(lead.responsibleId, input.actorId ?? '', input.actorRole)
    } else if (input.target.kind === 'contact') {
      await this.contacts.execute({ ...input, contactId: id, actorId: input.actorId ?? '' })
    } else {
      await this.opportunities.execute({
        ...input,
        opportunityId: id,
        actorId: input.actorId ?? '',
      })
    }
    return this.repository.list(input)
  }
}
