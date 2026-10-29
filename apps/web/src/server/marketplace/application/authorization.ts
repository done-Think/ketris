import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import type { UserRole } from '@server/auth/domain/user.entity'

export function assertBrokerProfileAccess(actorRole: UserRole): void {
  if (actorRole !== 'AGENT') {
    throw new ForbiddenError('Só corretores (papel AGENT) têm perfil público de corretor.')
  }
}

export function assertAgencyProfileAccess(actorRole: UserRole): void {
  if (!isAgencyManager(actorRole)) {
    throw new ForbiddenError('Só administradores da imobiliária editam o perfil público dela.')
  }
}
