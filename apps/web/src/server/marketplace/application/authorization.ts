import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

export function assertBrokerProfileAccess(actorPapel: Papel): void {
  if (actorPapel !== 'AGENT') {
    throw new ForbiddenError('Só corretores (papel AGENT) têm perfil público de corretor.')
  }
}

export function assertAgencyProfileAccess(actorPapel: Papel): void {
  if (actorPapel !== 'ADMIN' && actorPapel !== 'OWNER') {
    throw new ForbiddenError('Só administradores da imobiliária editam o perfil público dela.')
  }
}
