import { describe, expect, it } from 'vitest'
import { createActivityRequestSchema } from '../../schemas/activity.schema'
import { createContactRequestSchema, patchContactRequestSchema } from '../../schemas/contact.schema'
import {
  convertLeadRequestSchema,
  createLeadRequestSchema,
  patchLeadRequestSchema,
} from '../../schemas/lead.schema'
import {
  createOpportunityRequestSchema,
  patchOpportunityRequestSchema,
} from '../../schemas/opportunity.schema'
import { respondOpportunityRequestSchema } from '../../schemas/respond-opportunity.schema'

const opportunity = {
  propertyId: 'property-1',
  leadName: 'Maria',
  leadEmail: 'maria@example.test',
  proposedValue: 1800.45,
}
const lead = {
  name: 'Maria',
  phone: '11999999999',
  interest: 'Apartamento',
  budget: 'Sob consulta, até 2 mil',
  source: 'SITE',
}

describe('CRM request validation', () => {
  it.each([
    [createContactRequestSchema, { name: 'Maria', email: 'maria@example.test' }],
    [patchContactRequestSchema, { notes: 'Ligou' }],
    [createOpportunityRequestSchema, opportunity],
    [patchOpportunityRequestSchema, { notes: 'Ligou' }],
    [createLeadRequestSchema, lead],
    [patchLeadRequestSchema, { notes: 'Ligou' }],
    [convertLeadRequestSchema, { propertyId: 'property-1', proposedValue: 1800.45 }],
    [createActivityRequestSchema, { description: 'Ligou' }],
    [respondOpportunityRequestSchema, { action: 'ACEITAR' }],
  ])('rejects unknown fields rather than returning a false success', (schema, valid) => {
    expect(schema.safeParse(valid).success).toBe(true)
    expect(schema.safeParse({ ...valid, unknownField: 'must not disappear' }).success).toBe(false)
  })

  it('keeps all supported creation terms, including commas and line breaks inside conditions', () => {
    const terms = {
      contractTermMonths: 30,
      desiredStartDate: '2030-02-28',
      guaranteeType: 'CAUCAO',
      specialConditions: ['Pets, mediante vistoria', 'Desconto inicial\nRevisar em janeiro'],
    }
    const result = createOpportunityRequestSchema.parse({ ...opportunity, ...terms })
    expect(result).toMatchObject({
      ...terms,
      desiredStartDate: new Date('2030-02-28T00:00:00.000Z'),
    })
  })

  it.each([0, -1, 0.001, 1800.455, 10_000_000_000, Infinity])(
    'rejects money outside database precision: %s',
    (proposedValue) => {
      expect(
        createOpportunityRequestSchema.safeParse({ ...opportunity, proposedValue }).success,
      ).toBe(false)
      expect(
        convertLeadRequestSchema.safeParse({ propertyId: 'property-1', proposedValue }).success,
      ).toBe(false)
    },
  )
  it.each([0.01, 1800.45, 9_999_999_999.99])('preserves valid cents: %s', (proposedValue) => {
    expect(
      createOpportunityRequestSchema.parse({ ...opportunity, proposedValue }).proposedValue,
    ).toBe(proposedValue)
  })
  it.each(['2030-02-31', '2030-13-01', 'not-a-date'])(
    'rejects an impossible start date: %s',
    (desiredStartDate) => {
      expect(patchOpportunityRequestSchema.safeParse({ desiredStartDate }).success).toBe(false)
      expect(
        patchContactRequestSchema.safeParse({ lastInteraction: desiredStartDate }).success,
      ).toBe(false)
    },
  )
  it('allows free-text budget and missing lead email until conversion', () => {
    expect(createLeadRequestSchema.parse(lead).budget).toBe(lead.budget)
  })
  it('enforces approved text limits', () => {
    expect(createLeadRequestSchema.safeParse({ ...lead, budget: 'x'.repeat(501) }).success).toBe(
      false,
    )
    expect(patchContactRequestSchema.safeParse({ name: 'x'.repeat(201) }).success).toBe(false)
    expect(patchOpportunityRequestSchema.safeParse({ notes: 'x'.repeat(10_001) }).success).toBe(
      false,
    )
  })
})
