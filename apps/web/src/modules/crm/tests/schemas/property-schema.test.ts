import { describe, expect, it } from 'vitest'
import { createPropertySelectionSchema } from '../../schemas/property-schema'
import { property } from '../fixtures/property'
const schema = createPropertySelectionSchema((key) => key)

describe('CRM property selection', () => {
  it('retains the selected API property without dropping its display fields', () => {
    expect(schema.parse(property)).toEqual(property)
  })
  it('rejects an unselected property', () => expect(schema.safeParse(null).success).toBe(false))
  it('rejects an empty property ID', () =>
    expect(schema.safeParse({ ...property, id: ' ' }).success).toBe(false))
  it('uses the localized required message', () => {
    const result = schema.safeParse(null)
    expect(result.success ? undefined : result.error.issues[0].message).toBe('propertyRequired')
  })
})
