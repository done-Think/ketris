import { isAgencyManager } from '@server/auth/domain/roles'
import type { UserRole } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'

export function assertCanViewAgencyOverview(role: UserRole): void {
  if (!isAgencyManager(role)) {
    throw new ForbiddenError('Só o dono da imobiliária vê a visão geral da imobiliária.')
  }
}
