import { describe, expect, it } from 'vitest'

import {
  createEditOpportunityFormSchema,
  createOpportunityFormSchema,
  createUpdateOpportunitySchema,
  opportunityFiltersSchema,
  opportunityStatusSchema,
} from '../../schemas/opportunity-schema'

const updateOpportunitySchema = createUpdateOpportunitySchema((key) => key)
const opportunityFormSchema = createOpportunityFormSchema((key) => key)
const editOpportunityFormSchema = createEditOpportunityFormSchema((key) => key)

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
      opportunityFormSchema.safeParse({
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
      opportunityFormSchema.safeParse({
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
      opportunityFormSchema.safeParse({
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

  it('accepts a complete opportunity edit form', () => {
    expect(
      editOpportunityFormSchema.safeParse({
        leadName: 'Maria Silva',
        leadEmail: 'maria@example.com',
        leadPhone: '',
        proposedValue: '2500',
        contractTermMonths: '',
        desiredStartDate: '',
        guaranteeType: 'NENHUMA',
        specialConditions: '',
        notes: '',
      }).success,
    ).toBe(true)
  })

  it('rejects an invalid contract term on the edit form', () => {
    expect(
      editOpportunityFormSchema.safeParse({
        leadName: 'Maria Silva',
        leadEmail: 'maria@example.com',
        leadPhone: '',
        proposedValue: '2500',
        contractTermMonths: '-3',
        desiredStartDate: '',
        guaranteeType: 'NENHUMA',
        specialConditions: '',
        notes: '',
      }).success,
    ).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createOpportunityFormSchema((key) => `translated:${key}`)
    const result = translated.safeParse({
      propertyId: '',
      leadName: 'Maria Silva',
      leadEmail: 'maria@example.com',
      leadPhone: '',
      proposedValue: '2500',
      notes: '',
      status: 'RASCUNHO',
    })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:propertyRequired',
    )
  })
})
