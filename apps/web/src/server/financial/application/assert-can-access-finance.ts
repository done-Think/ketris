import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import type { UserRole } from '@server/auth/domain/user.entity'

export function assertCanAccessFinance(role: UserRole): void {
  if (!isAgencyManager(role)) {
    throw new ForbiddenError('Apenas o dono da imobiliária pode gerenciar o financeiro.')
  }
}
