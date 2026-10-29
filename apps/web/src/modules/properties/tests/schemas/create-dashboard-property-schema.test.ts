import { editableProperty } from '../fixtures/editable-property'
import { buildEditPropertyFormValues } from '../../utils/build-edit-property-form-values'
import { describe, expect, it } from 'vitest'

import {
  createDashboardPropertyDefaultValues,
  createDashboardPropertySchema,
} from '../../schemas/create-dashboard-property-schema'

const schema = createDashboardPropertySchema((key) => key)

describe('createDashboardPropertySchema', () => {
  it('starts empty and requires the user to fill in the listing', () => {
    const result = schema.safeParse(createDashboardPropertyDefaultValues)

    expect(result.success).toBe(false)
    expect(createDashboardPropertyDefaultValues.title).toBe('')
    expect(createDashboardPropertyDefaultValues.features).toEqual([])
    expect(createDashboardPropertyDefaultValues.publishingOptions).toEqual([])
  })

  it('rejects missing required listing fields', () => {
    const result = schema.safeParse({
      ...createDashboardPropertyDefaultValues,
      title: '',
      street: '',
      mainValue: '',
    })

    expect(result.success).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createDashboardPropertySchema((key) => `translated:${key}`)
    const result = translated.safeParse({
      ...createDashboardPropertyDefaultValues,
      title: '',
    })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:titleRequired',
    )
  })
})

it.each(['bedrooms', 'bathrooms', 'parkingSpaces'] as const)(
  'rejects fractional %s before submission',
  (field) => {
    const values = buildEditPropertyFormValues(editableProperty)
    expect(schema.safeParse({ ...values, [field]: 2 }).success).toBe(true)
    const result = schema.safeParse({ ...values, [field]: 1.5 })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: [field], message: 'integerRequired' }),
        ]),
      )
  },
)
