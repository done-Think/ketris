import { editableProperty } from '../fixtures/editable-property'
import { buildEditPropertyFormValues } from '../../utils/build-edit-property-form-values'
import { describe, expect, it } from 'vitest'

import {
  createDashboardPropertyDefaultValues,
  createDashboardPropertySchema,
} from '../../schemas/create-dashboard-property-schema'

const schema = createDashboardPropertySchema((key) => key)

describe('createDashboardPropertySchema', () => {
  it('requires a selection for new listings, accepts legacy text and rejects conflicting selections', () => {
    const values = {
      ...buildEditPropertyFormValues(editableProperty),
      negotiationTerm: '',
      negotiationConditions: [],
    }
    expect(schema.safeParse(values).error?.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['negotiationConditions'] })]),
    )
    expect(
      schema.safeParse({
        ...values,
        purpose: ['RENT'],
        negotiationConditions: ['REQUIRES_DEPOSIT'],
      }).success,
    ).toBe(true)
    expect(
      schema.safeParse({
        ...values,
        purpose: ['SALE'],
        negotiationConditions: ['REQUIRES_DEPOSIT'],
      }).success,
    ).toBe(false)
    expect(
      schema.safeParse({ ...values, negotiationConditions: ['CASH_ONLY', 'ACCEPTS_FINANCING'] })
        .success,
    ).toBe(false)
    expect(
      schema.safeParse({ ...values, negotiationTerm: 'Informação anterior preservada' }).success,
    ).toBe(true)
  })
  it('starts empty and requires the user to fill in the listing', () => {
    const result = schema.safeParse(createDashboardPropertyDefaultValues)

    expect(result.success).toBe(false)
    expect(createDashboardPropertyDefaultValues.title).toBe('')
    expect(createDashboardPropertyDefaultValues.features).toEqual([])
    expect(createDashboardPropertyDefaultValues.publishingOptions).toEqual([])
  })

  it('starts the numeric characteristics empty instead of 0, with the area still required', () => {
    const { bedrooms, bathrooms, parkingSpaces, area } = createDashboardPropertyDefaultValues
    expect([bedrooms, bathrooms, parkingSpaces, area]).toEqual(['', '', '', ''])

    const filled = {
      ...buildEditPropertyFormValues(editableProperty),
      bedrooms: '',
      bathrooms: '',
      parkingSpaces: '',
    }
    expect(schema.safeParse({ ...filled, area: '' }).error?.issues.map((i) => i.message)).toEqual([
      'areaRequired',
    ])
    expect(schema.safeParse({ ...filled, area: '85.5' })).toMatchObject({
      success: true,
      data: { bedrooms: 0, bathrooms: 0, parkingSpaces: 0, area: 85.5 },
    })
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

it.each(['00000-000', '00000000', '11111-111', '00999-999'])(
  'blocks the CEP %s that cannot exist',
  (zipCode) => {
    const values = buildEditPropertyFormValues(editableProperty)
    const result = schema.safeParse({ ...values, zipCode })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['zipCode'], message: 'zipCodeInvalid' }),
        ]),
      )
  },
)

it('blocks a CEP the postal code lookup did not find', () => {
  const values = buildEditPropertyFormValues(editableProperty)
  const blocking = createDashboardPropertySchema((key) => key, {
    isPostalCodeNotFound: (zipCode) => zipCode === values.zipCode,
  })
  const result = blocking.safeParse(values)
  expect(result.success).toBe(false)
  if (!result.success)
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['zipCode'], message: 'zipCodeNotFound' }),
      ]),
    )
})
