import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

// The agency's charges and revenue belong to its owners and admins; agents and renters get 403,
// whatever the screen shows (the finance menu is hidden from them too).
export function assertCanAccessFinance(papel: Papel): void {
  if (papel !== 'OWNER' && papel !== 'ADMIN') {
    throw new ForbiddenError(
      'Apenas proprietários ou administradores podem acessar o financeiro da imobiliária.',
    )
  }
}
