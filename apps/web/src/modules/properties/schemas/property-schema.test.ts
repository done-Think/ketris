import { describe, expect, it } from 'vitest'

import { propertySchema } from './property-schema'

describe('propertySchema', () => {
  it('accepts the minimum legacy property payload', () => {
    const parsed = propertySchema.parse({
      title: 'Apartamento no Jardins',
      type: 'apartment',
      price: 4800,
      city: 'São Paulo',
      address: 'Rua Haddock Lobo, 1200',
    })

    expect(parsed.status).toBe('draft')
    expect(parsed.media).toEqual([])
    expect(parsed.features).toEqual([])
  })

  it('accepts structured address, media and publication status', () => {
    const parsed = propertySchema.parse({
      title: 'Cobertura triplex',
      type: 'apartment',
      status: 'published',
      price: 12500,
      address: {
        street: 'Rua Tabapuã',
        number: '100',
        neighborhood: 'Itaim Bibi',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '04533010',
      },
      media: [{ url: 'https://example.com/image.jpg', isCover: true }],
      features: ['pool', 'balcony'],
    })

    expect(parsed.status).toBe('published')
    expect(parsed.media[0]).toMatchObject({ order: 0, isCover: true })
  })

  it('rejects invalid publication status', () => {
    const result = propertySchema.safeParse({
      title: 'Apartamento no Jardins',
      type: 'apartment',
      status: 'archived',
      price: 4800,
      address: 'Rua Haddock Lobo, 1200',
    })

    expect(result.success).toBe(false)
  })
})
