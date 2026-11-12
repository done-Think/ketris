import { describe, expect, it } from 'vitest'

import { isValidPostalCode } from '../../utils/postal-code'

describe('isValidPostalCode', () => {
  it.each(['37502330', '37502-330', '01000-000', '01001000', '99999-998'])(
    'accepts the existing-range CEP %s',
    (value) => {
      expect(isValidPostalCode(value)).toBe(true)
    },
  )

  it.each(['00000-000', '00000000', '11111-111', '99999999', '00999-999', '1234567', 'ABCDEFGH'])(
    'rejects the CEP %s that cannot exist',
    (value) => {
      expect(isValidPostalCode(value)).toBe(false)
    },
  )
})
