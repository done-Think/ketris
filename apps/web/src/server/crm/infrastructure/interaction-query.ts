import type { Prisma } from '@prisma/client'
import type { CrmDatabase, CrmScope } from '../types/prisma'
import type { InteractionTarget } from '../types/interaction'
import { contactAccess } from './contact-access'

export const interactionInclude = {
  lead: {
    select: {
      name: true,
      opportunityId: true,
      contactId: true,
      opportunity: { select: { contactId: true } },
    },
  },
} as const
export type InteractionRow = Prisma.CrmInteractionGetPayload<{
  include: typeof interactionInclude
}>
export function interactionAccess(scope: CrmScope): Prisma.CrmInteractionWhereInput {
  return {
    tenantId: scope.actorTenantId,
    OR: [
      {
        lead: {
          tenantId: scope.actorTenantId,
          ...(scope.actorRole === 'AGENT' ? { responsibleId: scope.actorId ?? '' } : {}),
        },
      },
      { leadId: null, contact: contactAccess(scope) },
    ],
  }
}
export async function interactionTarget(
  db: CrmDatabase,
  scope: CrmScope,
  target: InteractionTarget,
): Promise<Prisma.CrmInteractionWhereInput> {
  if (target.kind === 'contact')
    return {
      OR: [
        { leadId: null, contactId: target.id },
        { lead: { contactId: target.id } },
        {
          lead: {
            contactId: null,
            opportunity: {
              contactId: target.id,
              tenantId: scope.actorTenantId,
              ...(scope.actorRole === 'AGENT' ? { responsibleId: scope.actorId ?? '' } : {}),
            },
          },
        },
      ],
    }
  if (target.kind === 'lead') {
    const lead = await db.lead.findFirst({
      where: {
        id: target.id,
        tenantId: scope.actorTenantId,
        ...(scope.actorRole === 'AGENT' ? { responsibleId: scope.actorId ?? '' } : {}),
      },
      select: { contactId: true },
    })
    return {
      OR: [
        { leadId: target.id },
        ...(lead?.contactId ? [{ leadId: null, contactId: lead.contactId }] : []),
      ],
    }
  }
  const opportunity = await db.opportunity.findFirst({
    where: {
      id: target.id,
      tenantId: scope.actorTenantId,
      ...(scope.actorRole === 'AGENT' ? { responsibleId: scope.actorId ?? '' } : {}),
    },
    select: { contactId: true },
  })
  return {
    OR: [
      { lead: { opportunityId: target.id } },
      ...(opportunity?.contactId ? [{ leadId: null, contactId: opportunity.contactId }] : []),
    ],
  }
}
