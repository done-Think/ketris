import type { Papel } from '@server/auth/domain/user.entity'

import type { Contact } from '../../domain/contact.entity'
import { ContactNotFoundError } from '../../domain/errors'
import { assertAgentOwnsContact } from '../authorization'
import type { ContactRepository } from '../ports/contact-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export interface GetContactInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  contactId: string
}

export type GetContactOutput = Contact

export class GetContactUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly opportunityRepository: OpportunityRepository,
  ) {}

  async execute(input: GetContactInput): Promise<GetContactOutput> {
    const contact = await this.contactRepository.findById(input.contactId)

    if (!contact || contact.tenantId !== input.actorTenantId) {
      throw new ContactNotFoundError()
    }

    await assertAgentOwnsContact(
      this.opportunityRepository,
      input.actorTenantId,
      contact.id,
      input.actorId,
      input.actorPapel,
    )

    return contact
  }
}
