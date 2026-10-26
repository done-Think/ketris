import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import { assertCanViewAgencyOverview } from '../../domain/agency-overview-access'

describe('assertCanViewAgencyOverview', () => {
  it('libera o OWNER', () => {
    expect(() => assertCanViewAgencyOverview('OWNER')).not.toThrow()
  })

  it.each(['AGENT', 'RENTER', 'PROPERTY_OWNER'] as const)('bloqueia %s', (papel) => {
    expect(() => assertCanViewAgencyOverview(papel)).toThrow(ForbiddenError)
  })
})
