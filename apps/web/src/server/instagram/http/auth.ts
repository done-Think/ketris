import type { NextRequest } from 'next/server'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { assertInstagramActor } from '../domain/access'
import type { InstagramActor } from '../types/instagram'

export async function instagramActor(request: NextRequest): Promise<InstagramActor> {
  const token = await requireBearerAuth(request, authContainer.tokenService)
  const actor = { tenantId: token.tenantId, id: token.sub, role: token.role }
  assertInstagramActor(actor)
  return actor
}
