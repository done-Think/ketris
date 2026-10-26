import { isAgencyManager } from '@server/auth/domain/roles'
import type { Papel } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'

export function assertCanViewAgencyOverview(papel: Papel): void {
  if (!isAgencyManager(papel)) {
    throw new ForbiddenError('Só o dono da imobiliária vê a visão geral da imobiliária.')
  }
}
