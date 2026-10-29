import { describe, expect, it } from 'vitest'

import {
  createPropertyRequestSchema,
  updatePropertyRequestSchema,
  propertyAddressInputSchema,
} from '../../schemas/property-input.schema'

const listing = {
  amenities: ['FURNISHED', 'PET_FRIENDLY'],
  negotiationTerms: 'Caução de dois aluguéis',
  publishAfterReview: true,
  allowWhatsappContact: true,
  featured: false,
}

describe('property input contract', () => {
  const address = {
    street: 'Rua Padre Júlio Chevalier',
    number: '35',
    neighborhood: 'Anhumas',
    city: 'Itajubá',
    state: 'MG',
  }
  it.each(['37502330', '37502-330', '37.502-330', '37 502 330'])(
    'normalizes accepted CEP %s to eight digits at the API boundary',
    (zipCode) => {
      expect(propertyAddressInputSchema.parse({ ...address, zipCode }).zipCode).toBe('37502330')
    },
  )
  it.each(['1234567', '123456789', 'ABCDEFGH', '37502A330'])(
    'rejects invalid CEP %s at the API boundary',
    (zipCode) => {
      expect(propertyAddressInputSchema.safeParse({ ...address, zipCode }).success).toBe(false)
    },
  )

  it('accepts typed property and listing fields', () => {
    expect(
      createPropertyRequestSchema.parse({
        title: 'Casa',
        type: 'HOUSE',
        purpose: 'RENT',
        price: 2000,
        listing: listing,
      }).listing,
    ).toEqual(listing)
  })

  it('rejects free-text property types', () => {
    expect(updatePropertyRequestSchema.safeParse({ type: 'qualquer coisa' }).success).toBe(false)
  })

  it('rejects unsupported amenities and unrecognized listing flags', () => {
    expect(
      updatePropertyRequestSchema.safeParse({
        listing: { ...listing, amenities: ['INEXISTENTE'] },
      }).success,
    ).toBe(false)
    expect(
      updatePropertyRequestSchema.safeParse({ listing: { ...listing, status: 'PUBLISHED' } })
        .success,
    ).toBe(false)
  })

  it('keeps listing fields absent on unrelated patches', () => {
    expect(updatePropertyRequestSchema.parse({ price: 3000 })).toEqual({ price: 3000 })
  })

  it.each([
    ['title', 200],
    ['description', 10000],
  ] as const)('enforces the approved text limit for %s', (field, limit) => {
    expect(updatePropertyRequestSchema.safeParse({ [field]: 'a'.repeat(limit) }).success).toBe(true)
    expect(updatePropertyRequestSchema.safeParse({ [field]: 'a'.repeat(limit + 1) }).success).toBe(
      false,
    )
  })

  it('enforces the approved negotiation terms limit', () => {
    expect(
      updatePropertyRequestSchema.safeParse({
        listing: { ...listing, negotiationTerms: 'a'.repeat(2000) },
      }).success,
    ).toBe(true)
    expect(
      updatePropertyRequestSchema.safeParse({
        listing: { ...listing, negotiationTerms: 'a'.repeat(2001) },
      }).success,
    ).toBe(false)
  })
})
