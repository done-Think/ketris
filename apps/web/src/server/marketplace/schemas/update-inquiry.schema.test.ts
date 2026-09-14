import { describe, expect, it } from 'vitest'

import { patchInquiryRequestSchema, putInquiryRequestSchema } from './update-inquiry.schema'

describe('putInquiryRequestSchema', () => {
  it('aceita os campos-núcleo obrigatórios', () => {
    const result = putInquiryRequestSchema.safeParse({
      interessadoNome: 'Maria',
      interessadoEmail: 'maria@exemplo.com',
      valorProposto: 2500,
      status: 'EM_NEGOCIACAO',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita quando falta um campo-núcleo (status)', () => {
    const result = putInquiryRequestSchema.safeParse({
      interessadoNome: 'Maria',
      interessadoEmail: 'maria@exemplo.com',
      valorProposto: 2500,
    })

    expect(result.success).toBe(false)
  })

  it('coage inicioPretendido de string ISO para Date', () => {
    const result = putInquiryRequestSchema.parse({
      interessadoNome: 'Maria',
      interessadoEmail: 'maria@exemplo.com',
      valorProposto: 2500,
      status: 'ENVIADA',
      inicioPretendido: '2026-09-01',
    })

    expect(result.inicioPretendido).toBeInstanceOf(Date)
  })
})

describe('patchInquiryRequestSchema', () => {
  it('aceita uma atualização parcial (só status)', () => {
    const result = patchInquiryRequestSchema.safeParse({ status: 'ACEITA' })

    expect(result.success).toBe(true)
  })

  it('rejeita um corpo vazio (nenhum campo)', () => {
    const result = patchInquiryRequestSchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('permite limpar telefone com null', () => {
    const result = patchInquiryRequestSchema.safeParse({ interessadoTelefone: null })

    expect(result.success).toBe(true)
  })

  it('rejeita status fora do enum', () => {
    const result = patchInquiryRequestSchema.safeParse({ status: 'FECHADA' })

    expect(result.success).toBe(false)
  })
})
