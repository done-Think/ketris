import type { LeadContactLinkPort } from '../application/ports/lead-contact-link.port'
import { ContactNotFoundError, LeadContactConflictError, LeadNotFoundError } from '../domain/errors'
import type { CrmDatabase, CrmScope } from '../types/prisma'
import { contactAccess } from './contact-access'
import { recordLeadEvent } from './record-lead-event'
import { recordCrmAudit } from './record-crm-audit'

export class PrismaLeadContactLinkRepository implements LeadContactLinkPort {
  constructor(
    private readonly db: CrmDatabase,
    private readonly scope: CrmScope,
  ) {}
  async link(leadId: string, contactId: string): Promise<void> {
    const lead = await this.db.lead.findFirst({
      where: {
        id: leadId,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorRole === 'AGENT' ? { responsibleId: this.scope.actorId ?? '' } : {}),
      },
      include: { opportunity: { select: { id: true, contactId: true } } },
    })
    const contact = await this.db.contact.findFirst({
      where: { ...contactAccess(this.scope), id: contactId, archivedAt: null },
    })
    if (!lead) throw new LeadNotFoundError()
    if (!contact) throw new ContactNotFoundError()
    if (
      (lead.contactId && lead.contactId !== contact.id) ||
      (lead.opportunity?.contactId && lead.opportunity.contactId !== contact.id)
    )
      throw new LeadContactConflictError()
    await this.db.lead.update({
      where: { id: lead.id, tenantId: this.scope.actorTenantId },
      data: {
        contactId: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone || lead.phone,
        updatedById: this.scope.actorId,
      },
    })
    if (lead.opportunity && !lead.opportunity.contactId) {
      await this.db.opportunity.update({
        where: { id: lead.opportunity.id, tenantId: this.scope.actorTenantId },
        data: {
          contactId: contact.id,
          interestedName: contact.name,
          interestedEmail: contact.email,
          interestedPhone: contact.phone,
          updatedById: this.scope.actorId,
        },
      })
      await recordCrmAudit(this.db, this.scope, 'OPPORTUNITY', lead.opportunity.id, 'UPDATED', [
        'contactId',
      ])
    }
    if (lead.lastContactAt)
      await this.db.contact.updateMany({
        where: {
          id: contact.id,
          tenantId: this.scope.actorTenantId,
          OR: [{ lastInteraction: null }, { lastInteraction: { lt: lead.lastContactAt } }],
        },
        data: { lastInteraction: lead.lastContactAt, updatedById: this.scope.actorId },
      })
    await recordLeadEvent(this.db, this.scope, lead.id, 'CONTACT_LINKED')
    await recordCrmAudit(this.db, this.scope, 'LEAD', lead.id, 'UPDATED', ['contactId'])
    await recordCrmAudit(this.db, this.scope, 'CONTACT', contact.id, 'UPDATED', ['leads'])
  }
}
