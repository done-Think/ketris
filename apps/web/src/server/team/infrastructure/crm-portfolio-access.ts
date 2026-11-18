import type { Prisma } from '@prisma/client'
import type { TeamPortfolioAccessCommand } from '../types/team-repository'

export async function updateCrmPortfolioAccess(
  tx: Prisma.TransactionClient,
  command: TeamPortfolioAccessCommand,
) {
  const { tenantId, sourceId, destinationId, items, revoke } = command
  const sourceAccess = {
    OR: [{ responsibleId: sourceId }, { brokerAccess: { some: { tenantId, userId: sourceId } } }],
  }
  const leads = items.leads
    ? await tx.lead.findMany({
        where: { tenantId, ...sourceAccess },
        select: { id: true, opportunityId: true, responsibleId: true },
      })
    : []
  const opportunities = await tx.opportunity.findMany({
    where: {
      tenantId,
      OR: [
        ...(items.opportunities
          ? [
              {
                ...sourceAccess,
                ...(revoke
                  ? {}
                  : {
                      archivedAt: null,
                      status: { not: 'REJECTED' as const },
                      contract: { is: null },
                    }),
              },
            ]
          : []),
        { id: { in: leads.flatMap((lead) => (lead.opportunityId ? [lead.opportunityId] : [])) } },
      ],
    },
    select: { id: true, responsibleId: true },
  })
  const existingLeads = new Set(
    (
      await tx.leadBrokerAccess.findMany({
        where: { tenantId, userId: destinationId, leadId: { in: leads.map((lead) => lead.id) } },
        select: { leadId: true },
      })
    ).map((access) => access.leadId),
  )
  const existingOpportunities = new Set(
    (
      await tx.opportunityBrokerAccess.findMany({
        where: {
          tenantId,
          userId: destinationId,
          opportunityId: { in: opportunities.map((opportunity) => opportunity.id) },
        },
        select: { opportunityId: true },
      })
    ).map((access) => access.opportunityId),
  )
  const leadIds = leads
    .filter(
      (lead) =>
        lead.responsibleId !== destinationId &&
        (revoke ? existingLeads.has(lead.id) : !existingLeads.has(lead.id)),
    )
    .map((lead) => lead.id)
  const opportunityIds = opportunities
    .filter(
      (opportunity) =>
        opportunity.responsibleId !== destinationId &&
        (revoke
          ? existingOpportunities.has(opportunity.id)
          : !existingOpportunities.has(opportunity.id)),
    )
    .map((opportunity) => opportunity.id)
  if (revoke) {
    await tx.leadBrokerAccess.deleteMany({
      where: { tenantId, userId: destinationId, leadId: { in: leadIds } },
    })
    await tx.opportunityBrokerAccess.deleteMany({
      where: { tenantId, userId: destinationId, opportunityId: { in: opportunityIds } },
    })
  } else {
    if (leadIds.length)
      await tx.leadBrokerAccess.createMany({
        data: leadIds.map((leadId) => ({ tenantId, leadId, userId: destinationId })),
        skipDuplicates: true,
      })
    if (opportunityIds.length)
      await tx.opportunityBrokerAccess.createMany({
        data: opportunityIds.map((opportunityId) => ({
          tenantId,
          opportunityId,
          userId: destinationId,
        })),
        skipDuplicates: true,
      })
  }
  return { leadIds, opportunityIds }
}
