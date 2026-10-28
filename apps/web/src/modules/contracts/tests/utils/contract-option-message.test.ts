import { describe, expect, it, vi } from 'vitest'

import { formatContractOption } from '../../utils/contract-option-message'

describe('contract option presentation', () => {
  it('translates known contract values and preserves unknown historical values', () => {
    const translate = vi.fn((key: string) => `translated:${key}`)
    expect(formatContractOption('guaranteeTypeOptions', 'GUARANTOR', translate)).toBe(
      'translated:guaranteeTypeOptions.guarantor',
    )
    translate.mockClear()
    expect(formatContractOption('guaranteeTypeOptions', 'LEGACY_GUARANTEE', translate)).toBe(
      'LEGACY_GUARANTEE',
    )
    expect(formatContractOption('__proto__', 'GUARANTOR', translate)).toBe('GUARANTOR')
    expect(formatContractOption('contractTypeOptions', '__proto__', translate)).toBe('__proto__')
    expect(translate).not.toHaveBeenCalled()
  })
})
