import { describe, expect, it } from 'vitest'

import { submitInquiryRequestSchema } from './submit-inquiry.schema'

describe('submitInquiryRequestSchema', () => {
  it('aceita apenas nome e e-mail (campos mínimos)', () => {
    const result = submitInquiryRequestSchema.safeParse({
      interessadoNome: 'Maria',
      interessadoEmail: 'maria@exemplo.com',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita e-mail inválido', () => {
    const result = submitInquiryRequestSchema.safeParse({
      interessadoNome: 'Maria',
      interessadoEmail: 'nao-e-email',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita nome vazio', () => {
    const result = submitInquiryRequestSchema.safeParse({
      interessadoNome: '',
      interessadoEmail: 'maria@exemplo.com',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita valor proposto não positivo', () => {
    const result = submitInquiryRequestSchema.safeParse({
      interessadoNome: 'Maria',
      interessadoEmail: 'maria@exemplo.com',
      valorProposto: 0,
    })

    expect(result.success).toBe(false)
  })
})
