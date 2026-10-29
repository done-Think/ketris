import { describe, expect, it } from 'vitest'
import { property } from '../fixtures/property'

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
  it.each(['DRAFT', 'SENT', 'IN_NEGOTIATION', 'ACCEPTED', 'REJECTED'])(
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
      opportunityFiltersSchema.parse({ status: 'IN_NEGOTIATION', includeArchived: true }),
    ).toEqual({ status: 'IN_NEGOTIATION', includeArchived: true })
  })

  it('accepts a partial update and rejects an empty update', () => {
    expect(updateOpportunitySchema.safeParse({ status: 'ACCEPTED' }).success).toBe(true)
    expect(updateOpportunitySchema.safeParse({}).success).toBe(false)
  })

  it('accepts a complete manual creation form', () => {
    expect(
      opportunityFormSchema.safeParse({
        property,
        contractTermMonths: '',
        desiredStartDate: '',
        guaranteeType: 'NONE',
        specialConditions: [],
        contact: null,
        leadName: 'Maria Silva',
        leadEmail: 'maria@example.com',
        leadPhone: '',
        proposedValue: '2500',
        notes: '',
        status: 'DRAFT',
        responsibleId: '',
      }).success,
    ).toBe(true)
  })

  it('rejects a manual creation form without a selected property', () => {
    expect(
      opportunityFormSchema.safeParse({
        property: null,
        contractTermMonths: '',
        desiredStartDate: '',
        guaranteeType: 'NONE',
        specialConditions: [],
        contact: null,
        leadName: 'Maria Silva',
        leadEmail: 'maria@example.com',
        leadPhone: '',
        proposedValue: '2500',
        notes: '',
        status: 'DRAFT',
        responsibleId: '',
      }).success,
    ).toBe(false)
  })

  it('rejects a non-positive proposed value', () => {
    expect(
      opportunityFormSchema.safeParse({
        property,
        contractTermMonths: '',
        desiredStartDate: '',
        guaranteeType: 'NONE',
        specialConditions: [],
        contact: null,
        leadName: 'Maria Silva',
        leadEmail: 'maria@example.com',
        leadPhone: '',
        proposedValue: '0',
        notes: '',
        status: 'DRAFT',
        responsibleId: '',
      }).success,
    ).toBe(false)
  })

  it('accepts a complete opportunity edit form', () => {
    expect(
      editOpportunityFormSchema.safeParse({
        contact: null,
        leadName: 'Maria Silva',
        leadEmail: 'maria@example.com',
        leadPhone: '',
        proposedValue: '2500',
        contractTermMonths: '',
        desiredStartDate: '',
        guaranteeType: 'NONE',
        specialConditions: [],
        notes: '',
      }).success,
    ).toBe(true)
  })

  it('rejects an invalid contract term on the edit form', () => {
    expect(
      editOpportunityFormSchema.safeParse({
        contact: null,
        leadName: 'Maria Silva',
        leadEmail: 'maria@example.com',
        leadPhone: '',
        proposedValue: '2500',
        contractTermMonths: '-3',
        desiredStartDate: '',
        guaranteeType: 'NONE',
        specialConditions: [],
        notes: '',
      }).success,
    ).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createOpportunityFormSchema((key) => `translated:${key}`)
    const result = translated.safeParse({
      property: null,
      contact: null,
      leadName: 'Maria Silva',
      leadEmail: 'maria@example.com',
      leadPhone: '',
      proposedValue: '2500',
      notes: '',
      status: 'DRAFT',
    })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:propertyRequired',
    )
  })
})
