import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { prisma } from '@server/db/prisma'
import { authOptions } from '@shared/lib/auth/auth-options'
import { FaceCheckError } from './http/errors'
import type { FaceCheckActor, FaceCheckDatabase } from './types/access'

export type { FaceCheckActor } from './types/access'

export async function resolveFaceCheckActor(
  input: { userId: string; tenantId: string },
  database: FaceCheckDatabase = prisma,
): Promise<FaceCheckActor> {
  const user = await database.user.findFirst({
    where: {
      id: input.userId,
      tenantId: input.tenantId,
      active: true,
      emailVerifiedAt: { not: null },
      membershipApprovedAt: { not: null },
      role: { in: ['OWNER', 'AGENT'] },
      tenant: { status: { in: ['ACTIVE', 'TRIAL'] }, accountType: { in: ['AGENCY', 'BROKER'] } },
    },
    select: {
      id: true,
      tenantId: true,
      role: true,
      tenant: { select: { name: true, accountType: true } },
    },
  })
  if (!user) throw new FaceCheckError('FORBIDDEN', 403)
  return {
    actorId: user.id,
    tenantId: user.tenantId,
    role: user.role as FaceCheckActor['role'],
    accountType: user.tenant.accountType as FaceCheckActor['accountType'],
    agencyName: user.tenant.name,
  }
}

export async function readFaceCheckRequestIdentity(
  request: NextRequest,
): Promise<{ userId: string; tenantId: string }> {
  let userId: string | undefined
  let tenantId: string | undefined
  if (request.headers.has('authorization')) {
    const token = await requireBearerAuth(request, authContainer.tokenService)
    userId = token.sub
    tenantId = token.tenantId
  } else {
    const session = await getServerSession(authOptions)
    if (session?.scope === 'tenant') {
      userId = session.user?.id
      tenantId = session.tenantId
    }
  }
  if (!userId || !tenantId) throw new FaceCheckError('UNAUTHORIZED', 401)
  return { userId, tenantId }
}

export async function requireFaceCheckActor(request: NextRequest): Promise<FaceCheckActor> {
  return resolveFaceCheckActor(await readFaceCheckRequestIdentity(request))
}
