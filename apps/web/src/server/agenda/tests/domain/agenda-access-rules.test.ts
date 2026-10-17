import { describe, expect, it } from 'vitest'

import { assertCanAccessAgenda } from '../../domain/agenda-access-rules'
import { AgendaRenterForbiddenError } from '../../domain/errors'

describe('assertCanAccessAgenda', () => {
  it.each(['ADMIN', 'OWNER', 'AGENT'] as const)('permite acesso para %s', (papel) => {
    expect(() => assertCanAccessAgenda(papel)).not.toThrow()
  })

  it('bloqueia RENTER com 403', () => {
    expect(() => assertCanAccessAgenda('RENTER')).toThrow(AgendaRenterForbiddenError)
    expect(() => assertCanAccessAgenda('RENTER')).toThrow(
      expect.objectContaining({ status: 403, code: 'FORBIDDEN' }),
    )
  })
})
