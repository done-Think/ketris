import { describe, expect, it } from 'vitest'

import {
  opportunityFiltersSchema,
  opportunityStatusSchema,
  updateOpportunitySchema,
} from './opportunity-schema'

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
})
