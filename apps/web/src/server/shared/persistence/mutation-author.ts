import type { Prisma } from '@prisma/client'
import { ForbiddenError } from '@server/shared/errors'

export async function resolveMutationAuthor(
  db: Pick<Prisma.TransactionClient, 'user'>,
  tenantId: string,
  actorId?: string | null,
): Promise<string | null> {
  if (!actorId) return null
  const actor = await db.user.findFirst({
    where: { id: actorId, tenantId, active: true },
    select: { id: true },
  })
  if (!actor) throw new ForbiddenError()
  return actor.id
}
