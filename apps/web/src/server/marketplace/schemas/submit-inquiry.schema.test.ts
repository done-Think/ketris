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

  it('aceita telefone com DDD e rejeita telefone incompleto ou longo demais', () => {
    const base = { leadName: 'Maria', leadEmail: 'maria@exemplo.com' }

    expect(
      submitInquiryRequestSchema.safeParse({ ...base, leadPhone: '(41) 99999-9999' }).success,
    ).toBe(true)
    expect(submitInquiryRequestSchema.safeParse({ ...base, leadPhone: '3598' }).success).toBe(false)
    expect(
      submitInquiryRequestSchema.safeParse({ ...base, leadPhone: '1'.repeat(23) }).success,
    ).toBe(false)
  })
})
