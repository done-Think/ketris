import type { Papel } from '@server/auth/domain/user.entity'

import { AgendaRenterForbiddenError } from './errors'

export function assertCanAccessAgenda(papel: Papel): void {
  if (papel === 'RENTER') {
    throw new AgendaRenterForbiddenError()
  }
}
