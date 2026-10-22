import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

// Agency-wide finance and all mutations are restricted to owners and admins.
// Renter reads use resolveChargeReadScope and require an explicit contract-party link.
export function assertCanAccessFinance(papel: Papel): void {
  if (papel !== 'OWNER' && papel !== 'ADMIN') {
    throw new ForbiddenError(
      'Apenas proprietários ou administradores podem acessar o financeiro da imobiliária.',
    )
  }
}
