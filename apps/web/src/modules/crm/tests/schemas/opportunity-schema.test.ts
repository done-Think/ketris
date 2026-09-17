import { describe, expect, it } from 'vitest'

import {
  createOpportunityFormSchema,
  opportunityFiltersSchema,
  opportunityStatusSchema,
  updateOpportunitySchema,
} from '../../schemas/opportunity-schema'

describe('opportunity schemas', () => {
  it.each(['RASCUNHO', 'ENVIADA', 'EM_NEGOCIACAO', 'ACEITA', 'RECUSADA'])(
    'accepts the supported status %s',
    (status) => {
      expect(opportunityStatusSchema.parse(status)).toBe(status)
    },
  )

  it('rejects a pipeline status that is not supported by the API', () => {
    expect(opportunityStatusSchema.safeParse('QUALIFICACAO').success).toBe(false)
  })

  it('validates list filters', () => {
    expect(
      opportunityFiltersSchema.parse({ status: 'EM_NEGOCIACAO', includeArchived: true }),
    ).toEqual({ status: 'EM_NEGOCIACAO', includeArchived: true })
  })

  it('accepts a partial update and rejects an empty update', () => {
    expect(updateOpportunitySchema.safeParse({ status: 'ACEITA' }).success).toBe(true)
    expect(updateOpportunitySchema.safeParse({}).success).toBe(false)
  })

  it('accepts a complete manual creation form', () => {
    expect(
      createOpportunityFormSchema.safeParse({
        propertyId: 'property-1',
        leadName: 'Maria Silva',
        leadEmail: 'maria@example.com',
        leadPhone: '',
        proposedValue: '2500',
        notes: '',
        status: 'RASCUNHO',
      }).success,
    ).toBe(true)
  })

  it('rejects a manual creation form without a selected property', () => {
    expect(
      createOpportunityFormSchema.safeParse({
        propertyId: '',
        leadName: 'Maria Silva',
        leadEmail: 'maria@example.com',
        leadPhone: '',
        proposedValue: '2500',
        notes: '',
        status: 'RASCUNHO',
      }).success,
    ).toBe(false)
  })

  it('rejects a non-positive proposed value', () => {
    expect(
      createOpportunityFormSchema.safeParse({
        propertyId: 'property-1',
        leadName: 'Maria Silva',
        leadEmail: 'maria@example.com',
        leadPhone: '',
        proposedValue: '0',
        notes: '',
        status: 'RASCUNHO',
      }).success,
    ).toBe(false)
  })
})
