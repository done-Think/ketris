import { describe, expect, it } from 'vitest'

import {
  chargeReasonRequestSchema,
  createChargeRequestSchema,
  updateChargeRequestSchema,
} from '../../schemas/charge-input.schema'
import { initChargeReceiptUploadRequestSchema } from '../../schemas/charge-receipt.schema'

describe('schemas de entrada do financeiro', () => {
  it('a edição não aceita status nem campos desconhecidos', () => {
    expect(updateChargeRequestSchema.safeParse({ status: 'PAGA' }).success).toBe(false)
    expect(updateChargeRequestSchema.safeParse({ amount: 10 }).success).toBe(true)
  })

  it('a criação só aceita pendente ou agendada e exige descrição sem contrato', () => {
    const base = { type: 'A_RECEBER', amount: 10, dueDate: '2026-11-01' }
    expect(
      createChargeRequestSchema.safeParse({ ...base, status: 'PAGA', description: 'x' }).success,
    ).toBe(false)
    expect(createChargeRequestSchema.safeParse({ ...base, status: 'PENDENTE' }).success).toBe(false)
    expect(
      createChargeRequestSchema.safeParse({ ...base, status: 'AGENDADA', description: 'x' })
        .success,
    ).toBe(true)
  })

  it('o motivo de cancelamento e de estorno é obrigatório', () => {
    expect(chargeReasonRequestSchema.safeParse({ reason: ' ' }).success).toBe(false)
    expect(chargeReasonRequestSchema.safeParse({ reason: 'Pix devolvido' }).success).toBe(true)
  })

  it('o comprovante aceita PDF, JPG e PNG até 10 MB', () => {
    const base = { name: 'c.pdf', size: 100, sha256: 'a'.repeat(64) }
    expect(
      initChargeReceiptUploadRequestSchema.safeParse({ ...base, contentType: 'image/png' }).success,
    ).toBe(true)
    expect(
      initChargeReceiptUploadRequestSchema.safeParse({ ...base, contentType: 'text/html' }).success,
    ).toBe(false)
    expect(
      initChargeReceiptUploadRequestSchema.safeParse({
        ...base,
        contentType: 'application/pdf',
        size: 10 * 1024 * 1024 + 1,
      }).success,
    ).toBe(false)
  })
})
