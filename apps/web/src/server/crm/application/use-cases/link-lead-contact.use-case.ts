import type {
  LinkLeadContactInput,
  LinkLeadContactOutput,
} from '../../types/link-lead-contact.use-case.types'
export type {
  LinkLeadContactInput,
  LinkLeadContactOutput,
} from '../../types/link-lead-contact.use-case.types'

import {
  ContactNotFoundError,
  LeadContactConflictError,
  LeadNotFoundError,
} from '../../domain/errors'
import type { CrmUseCase } from '../../types/prisma'
import type {
  CreateContactInput,
  CreateContactOutput,
} from '../../types/create-contact.use-case.types'
import type { GetContactInput, GetContactOutput } from '../../types/get-contact.use-case.types'
import { assertCrmAccess, assertLeadAccess } from '../authorization'
import type { LeadContactLinkPort } from '../ports/lead-contact-link.port'
import type { LeadRepository } from '../ports/lead-repository.port'

export class LinkLeadContactUseCase {
  constructor(
    private readonly leads: LeadRepository,
    private readonly links: LeadContactLinkPort,
    private readonly getContact: CrmUseCase<GetContactInput, GetContactOutput>,
    private readonly createContact: CrmUseCase<CreateContactInput, CreateContactOutput>,
  ) {}

  async execute(input: LinkLeadContactInput): Promise<LinkLeadContactOutput> {
    assertCrmAccess(input.actorRole)
    const lead = await this.leads.findById(input.leadId)
    if (!lead || lead.tenantId !== input.actorTenantId) throw new LeadNotFoundError()
    assertLeadAccess(lead.responsibleId, input.actorId, input.actorRole)
    if (lead.contactId) {
      if ('contactId' in input && input.contactId === lead.contactId) return lead
      throw new LeadContactConflictError()
    }
    const contact =
      'contactId' in input
        ? await this.getContact.execute({ ...input, contactId: input.contactId })
        : await this.createContact.execute({
            actorTenantId: input.actorTenantId,
            actorId: input.actorId,
            actorRole: input.actorRole,
            name: input.contact.name,
            email: input.contact.email,
            phone: input.contact.phone ?? null,
            type: input.contact.type ?? 'RENTER',
            notes: input.contact.notes ?? null,
            avatarUrl: input.contact.avatarUrl ?? null,
          })
    if (contact.tenantId !== input.actorTenantId || contact.archivedAt)
      throw new ContactNotFoundError()
    await this.links.link(lead.id, contact.id)
    const linked = await this.leads.findById(lead.id)
    if (!linked) throw new LeadNotFoundError()
    return linked
  }
}
