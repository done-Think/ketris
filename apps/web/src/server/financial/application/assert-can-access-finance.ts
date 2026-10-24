import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import type { Papel } from '@server/auth/domain/user.entity'

export function assertCanAccessFinance(papel: Papel): void {
  if (!isAgencyManager(papel)) {
    throw new ForbiddenError('Apenas o dono da imobiliária pode gerenciar o financeiro.')
  }
}
