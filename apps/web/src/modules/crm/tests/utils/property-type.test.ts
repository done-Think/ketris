import { describe, expect, it } from 'vitest'

import { crmPropertyTypes } from '../../config/property-types'
import { toCrmPropertyType } from '../../utils/property-type'

describe('toCrmPropertyType', () => {
  it.each(crmPropertyTypes)('keeps the known API code %s', (propertyType) => {
    expect(toCrmPropertyType(propertyType)).toBe(propertyType)
  })

  it.each(['WAREHOUSE', 'apartment', '', null, undefined])(
    'falls back to OTHER for the unknown value %s',
    (value) => {
      expect(toCrmPropertyType(value)).toBe('OTHER')
    },
  )
})
