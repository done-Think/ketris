import { describe, expect, it } from 'vitest'

import { buildEditPropertyFormValues } from '../../utils/build-edit-property-form-values'
import { createDashboardPropertySchema } from '../../schemas/create-dashboard-property-schema'
import { toPropertyPayload } from '../../utils/to-property-payload'
import { editableProperty as property } from '../fixtures/editable-property'
import { toCreatePayload, toUpdatePayload } from '../../utils/property-adapter'
import {
  createPropertyRequestSchema,
  propertyAddressInputSchema,
  propertyMediaInputSchema,
} from '@server/properties/schemas/property-input.schema'

describe('property form roundtrip', () => {
  it('sends a CEP with only digits without clearing coordinates when only its presentation changes', () => {
    const values = { ...buildEditPropertyFormValues(property), zipCode: '80.000-000' }
    const payload = toPropertyPayload(values, { existingAddress: property.address })
    expect(payload.address).toMatchObject({
      zipCode: '80000000',
      latitude: -25.4,
      longitude: -49.2,
    })
    const parsed = createDashboardPropertySchema((key) => key).parse(values)
    expect(parsed.zipCode).toBe('80000000')
  })

  it.each(['1234567', '123456789', 'ABCDEFGH', '37502A330'])(
    'rejects an invalid CEP %s in the form',
    (zipCode) => {
      const result = createDashboardPropertySchema((key) => key).safeParse({
        ...buildEditPropertyFormValues(property),
        zipCode,
      })
      expect(result.success).toBe(false)
    },
  )

  it('sends only supported API fields without silently discarding current form data', () => {
    const payload = toPropertyPayload(buildEditPropertyFormValues(property), {
      canChooseOwner: true,
    })
    const strictContract = createPropertyRequestSchema
      .extend({
        address: propertyAddressInputSchema.strict().optional(),
        media: propertyMediaInputSchema.strict().array().optional(),
      })
      .strict()
    for (const body of [toCreatePayload(payload), toUpdatePayload(payload)]) {
      const wirePayload = JSON.parse(JSON.stringify(body))
      expect(strictContract.parse(wirePayload)).toEqual(wirePayload)
    }
  })
  it('preserves listing options and dual-purpose prices when editing', () => {
    const payload = toPropertyPayload(buildEditPropertyFormValues(property), {
      existingAddress: property.address,
    })
    expect(payload.listing).toEqual(property.listing)
    expect(payload.purpose).toBe('BOTH')
    expect(payload.price).toBe(500000)
    expect(payload.rentalPrice).toBe(2000)
    expect(payload.address).toEqual(property.address)
  })

  it('validates and submits stable codes without dropping amenities', () => {
    const values = buildEditPropertyFormValues(property)
    const schema = createDashboardPropertySchema((key) => key)
    const parsed = schema.parse(values)
    expect(parsed.type).toBe('house')
    expect(parsed.purpose).toEqual(['RENT', 'SALE'])
    expect(parsed.features).toEqual(['furnished', 'petFriendly'])
    expect(parsed.publishingOptions).toEqual(['publishAfterReview', 'featured'])
    expect(toPropertyPayload(parsed).listing).toEqual(property.listing)
    expect(schema.safeParse({ ...values, type: 'Casa' }).success).toBe(false)
    expect(schema.safeParse({ ...values, features: ['Mobiliado'] }).success).toBe(false)
    expect(
      schema.safeParse({ ...values, publishingOptions: ['Destacar imóvel na listagem inicial'] })
        .success,
    ).toBe(false)
  })

  it('allows clearing amenities and publication options', () => {
    const values = buildEditPropertyFormValues(property)
    const payload = toPropertyPayload({ ...values, features: [], publishingOptions: [] })
    expect(payload.listing).toMatchObject({
      amenities: [],
      publishAfterReview: false,
      allowWhatsappContact: false,
      featured: false,
    })
  })
  it('clears stale coordinates when the address changes and accepts explicitly updated coordinates', () => {
    const values = buildEditPropertyFormValues(property)
    const stale = toPropertyPayload(
      { ...values, street: 'Outro endereço' },
      { existingAddress: property.address },
    )
    expect(stale.address).toMatchObject({ latitude: null, longitude: null })
    const updated = toPropertyPayload(
      { ...values, street: 'Outro endereço', latitude: -23.5, longitude: -46.6 },
      { existingAddress: property.address },
    )
    expect(updated.address).toMatchObject({ latitude: -23.5, longitude: -46.6 })
  })

  it('saves media in the displayed order so the first image remains the cover', () => {
    const values = buildEditPropertyFormValues(property)
    const result = toPropertyPayload({
      ...values,
      media: [
        { url: 'existing', order: 4 },
        { url: 'new', order: 1 },
      ],
    })
    expect(result.media).toEqual([
      { url: 'existing', order: 0 },
      { url: 'new', order: 1 },
    ])
  })
})
