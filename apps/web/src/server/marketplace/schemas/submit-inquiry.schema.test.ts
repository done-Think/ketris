import { describe, expect, it } from 'vitest'

import { submitInquiryRequestSchema } from './submit-inquiry.schema'

describe('submitInquiryRequestSchema', () => {
  it('aceita apenas nome e e-mail (campos mínimos)', () => {
    const result = submitInquiryRequestSchema.safeParse({
      leadName: 'Maria',
      leadEmail: 'maria@exemplo.com',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita e-mail inválido', () => {
    const result = submitInquiryRequestSchema.safeParse({
      leadName: 'Maria',
      leadEmail: 'nao-e-email',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita nome vazio', () => {
    const result = submitInquiryRequestSchema.safeParse({
      leadName: '',
      leadEmail: 'maria@exemplo.com',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita valor proposto não positivo', () => {
    const result = submitInquiryRequestSchema.safeParse({
      leadName: 'Maria',
      leadEmail: 'maria@exemplo.com',
      proposedValue: 0,
    })

    expect(result.success).toBe(false)
  })
})
