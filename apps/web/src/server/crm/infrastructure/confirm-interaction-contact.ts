import type { CrmDatabase, CrmScope } from '../types/prisma'
import type { InteractionRow } from './interaction-query'
import { recordCrmAudit } from './record-crm-audit'

export async function confirmInteractionContact(
  db: CrmDatabase,
  scope: CrmScope,
  row: InteractionRow,
  completedAt: Date,
) {
  if (row.leadId) {
    await db.lead.updateMany({
      where: {
        id: row.leadId,
        tenantId: scope.actorTenantId,
        OR: [{ lastContactAt: null }, { lastContactAt: { lt: completedAt } }],
      },
      data: { lastContactAt: completedAt, updatedById: scope.actorId },
    })
    await db.lead.updateMany({
      where: { id: row.leadId, tenantId: scope.actorTenantId, firstContactAt: null },
      data: { firstContactAt: completedAt },
    })
  }
  const contactId = row.contactId ?? row.lead?.contactId ?? row.lead?.opportunity?.contactId
  if (contactId) {
    const updated = await db.contact.updateMany({
      where: {
        id: contactId,
        tenantId: scope.actorTenantId,
        archivedAt: null,
        OR: [{ lastInteraction: null }, { lastInteraction: { lt: completedAt } }],
      },
      data: { lastInteraction: completedAt, updatedById: scope.actorId },
    })
    if (updated.count)
      await recordCrmAudit(db, scope, 'CONTACT', contactId, 'UPDATED', ['lastInteraction'])
  }
}
