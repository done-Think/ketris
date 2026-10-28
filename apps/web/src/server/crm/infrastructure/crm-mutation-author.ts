import { ForbiddenError } from '@server/shared/errors'

import type { CrmDatabase, CrmScope } from '../types/prisma'

// Authorship comes from the authenticated scope, never from the mutation payload.
// A missing actor denotes an explicit internal system operation.
export async function crmMutationAuthor(db: CrmDatabase, scope: CrmScope): Promise<string | null> {
  if (!scope.actorId) return null
  const actor = await db.user.findFirst({
    where: { id: scope.actorId, tenantId: scope.actorTenantId, active: true },
    select: { id: true },
  })
  if (!actor) throw new ForbiddenError()
  return actor.id
}
