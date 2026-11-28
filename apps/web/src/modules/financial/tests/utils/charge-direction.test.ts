import { describe, expect, it } from 'vitest'

import { chargeDirectionForViewer } from '../../utils/charge-direction'

describe('chargeDirectionForViewer', () => {
  it('flips the agency direction for the renter', () => {
    expect(chargeDirectionForViewer('receivable', true)).toBe('payable')
    expect(chargeDirectionForViewer('payable', true)).toBe('receivable')
  })

  it('keeps the agency direction for everyone else', () => {
    expect(chargeDirectionForViewer('receivable', false)).toBe('receivable')
    expect(chargeDirectionForViewer('payable', false)).toBe('payable')
  })
})
