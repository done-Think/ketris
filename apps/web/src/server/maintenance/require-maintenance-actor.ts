import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@shared/lib/auth/auth-options'
import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { UnauthorizedError } from '@server/shared/errors'
import type { MaintenanceActor } from './types/maintenance-ticket'

export async function requireMaintenanceActor(
  request: NextRequest,
  allowSession = false,
): Promise<MaintenanceActor> {
  let userId: string | undefined
  let tenantId: string | undefined
  if (request.headers.has('authorization') || !allowSession) {
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
  if (!userId || !tenantId) throw new UnauthorizedError()
  const user = await authContainer.userRepository.findById(userId)
  if (!user || !user.ativo || user.tenantId !== tenantId || !user.vinculoAprovadoEm)
    throw new UnauthorizedError()
  return {
    actorId: user.id,
    actorTenantId: user.tenantId,
    actorName: user.nome,
    actorPapel: user.papel,
  }
}
