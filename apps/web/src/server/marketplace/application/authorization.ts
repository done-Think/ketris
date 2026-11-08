import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import type { TenantAccountType } from '@server/auth/types/user-access'
import type { UserRole } from '@server/auth/domain/user.entity'

export function assertBrokerProfileAccess(
  actorRole: UserRole,
  actorAccountType?: TenantAccountType,
): void {
  const isTeamBroker = actorRole === 'AGENT'
  const isSoloBroker = actorRole === 'OWNER' && actorAccountType === 'BROKER'
  if (!isTeamBroker && !isSoloBroker) {
    throw new ForbiddenError('Só corretores têm perfil público de corretor.')
  }
}

export function assertAgencyProfileAccess(actorRole: UserRole): void {
  if (!isAgencyManager(actorRole)) {
    throw new ForbiddenError('Só administradores da imobiliária editam o perfil público dela.')
  }
}
