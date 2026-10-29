import { describe, expect, it } from 'vitest'
import {
  createPropertyRequestSchema,
  updatePropertyRequestSchema,
} from '@server/properties/schemas/property-input.schema'
import {
  createDashboardPropertyDefaultValues,
  createDashboardPropertySchema,
} from '../../schemas/create-dashboard-property-schema'
import { toPropertyPayload } from '../../utils/to-property-payload'
import { toCreatePayload, toUpdatePayload } from '../../utils/property-adapter'

describe('property form and API contract', () => {
  it.each(['RENT', 'SALE', 'BOTH'] as const)(
    'submits %s using the same English fields and enum values validated by the server',
    (purpose) => {
      const form = createDashboardPropertySchema((key) => key).parse({
        ...createDashboardPropertyDefaultValues,
        purpose: purpose === 'BOTH' ? ['RENT', 'SALE'] : [purpose],
        type: 'house',
        title: 'Casa com jardim',
        description: 'Descrição preservada em português.',
        street: 'Rua das Flores',
        number: '10',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
        zipCode: '80000000',
        mainValue: 400000,
        rentalValue: 2000,
        area: 100,
        propertyTax: 400,
        negotiationTerm: 'Aceita proposta',
        media: [{ url: 'https://example.test/photo.png', type: 'photo', order: 0 }],
      })
      const payload = toCreatePayload(toPropertyPayload(form))
      expect(createPropertyRequestSchema.parse(payload)).toEqual(payload)
      expect(payload).toMatchObject({
        purpose,
        type: 'HOUSE',
        propertyTax: 400,
        description: form.description,
        address: { zipCode: '80000000' },
        media: [{ type: 'photo', position: 0 }],
      })
      expect(updatePropertyRequestSchema.parse(toUpdatePayload(toPropertyPayload(form)))).toEqual(
        payload,
      )
    },
  )
})
