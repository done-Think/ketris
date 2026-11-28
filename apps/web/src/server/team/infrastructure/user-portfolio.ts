import { prisma } from '@server/db/prisma'

export async function userHasPortfolio(tenantId: string, userId: string): Promise<boolean> {
  const [properties, leads, opportunities, events] = await Promise.all([
    prisma.property.count({ where: { tenantId, responsibleId: userId } }),
    prisma.lead.count({ where: { tenantId, responsibleId: userId } }),
    prisma.opportunity.count({ where: { tenantId, responsibleId: userId } }),
    prisma.agendaEvent.count({ where: { tenantId, responsibleId: userId } }),
  ])

  return properties + leads + opportunities + events > 0
}
