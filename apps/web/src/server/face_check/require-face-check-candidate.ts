import type { NextRequest } from 'next/server'
import { prisma } from '@server/db/prisma'
import { FaceCheckError } from './http/errors'
import { readFaceCheckRequestIdentity } from './require-face-check-actor'
import type { FaceCheckDatabase } from './types/access'
import type { FaceCheckCandidate } from './types/candidate'

export type { FaceCheckCandidate } from './types/candidate'

// This identity resolver deliberately has no manager role/account-type grant.
export async function resolveFaceCheckCandidate(
  input: { userId: string; tenantId: string },
  database: FaceCheckDatabase = prisma,
): Promise<FaceCheckCandidate> {
  const user = await database.user.findFirst({
    where: {
      id: input.userId,
      tenantId: input.tenantId,
      active: true,
      emailVerifiedAt: { not: null },
      membershipApprovedAt: { not: null },
      tenant: { status: { in: ['ACTIVE', 'TRIAL'] } },
    },
    select: { id: true, tenantId: true, role: true, tenant: { select: { accountType: true } } },
  })
  if (!user) throw new FaceCheckError('FORBIDDEN', 403)
  return {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    accountType: user.tenant.accountType,
  }
}

export async function requireFaceCheckCandidate(request: NextRequest): Promise<FaceCheckCandidate> {
  return resolveFaceCheckCandidate(await readFaceCheckRequestIdentity(request))
}
