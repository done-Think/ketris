import type { Prisma } from '@prisma/client'
import { ForbiddenError } from '@server/shared/errors'

// Renters can belong to the platform's renter tenant. Their explicit contract
// party link, rather than membership in the agency, authorizes that boundary.
export async function maintenanceMutationAuthor(
  db: Prisma.TransactionClient,
  ticket: { tenantId: string; contractId: string | null },
  authorId: string | null,
): Promise<string | null> {
  if (!authorId) return null
  const actor = await db.user.findFirst({
    where: { id: authorId, active: true },
    select: { id: true, tenantId: true, role: true },
  })
  if (!actor) throw new ForbiddenError()
  if (actor.tenantId !== ticket.tenantId) {
    if (actor.role !== 'RENTER' || !ticket.contractId) throw new ForbiddenError()
    const party = await db.contractParty.findFirst({
      where: {
        contractId: ticket.contractId,
        tenantId: ticket.tenantId,
        role: 'RENTER',
        userId: actor.id,
      },
      select: { id: true },
    })
    if (!party) throw new ForbiddenError()
  }
  return actor.id
}
