import { describe, expect, it } from 'vitest'

import { RECEIPT_MAX_BYTES } from '../../config/receipt-limits'
import { createChargeFormSchema } from '../../schemas/charge-form-schema'
import { createChargeReasonSchema } from '../../schemas/charge-reason-schema'
import { createRegisterPaymentSchema } from '../../schemas/register-payment-schema'

const t = (key: string) => key
const errorsOf = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map(({ message }) => message) ?? []

const validCharge = {
  description: 'Aluguel',
  amount: '2800',
  dueDate: '2026-10-10',
  direction: 'receivable',
  status: 'pending',
}

describe('charge form schema', () => {
  it('accepts a valid charge and coerces the amount', () => {
    expect(createChargeFormSchema(t).parse(validCharge).amount).toBe(2800)
  })

  it('requires a description only for standalone charges', () => {
    const blank = { ...validCharge, description: '  ' }
    expect(errorsOf(createChargeFormSchema(t).safeParse(blank))).toEqual(['descriptionRequired'])
    expect(createChargeFormSchema(t, false).safeParse(blank).success).toBe(true)
  })

  it('rejects zero amounts, invalid dates and long descriptions', () => {
    const result = createChargeFormSchema(t).safeParse({
      ...validCharge,
      description: 'x'.repeat(501),
      amount: '0',
      dueDate: '10/10/2026',
    })
    expect(errorsOf(result)).toEqual(['descriptionTooLong', 'amountPositive', 'dateInvalid'])
  })

  it('does not accept paid or cancelled as an initial status', () => {
    expect(createChargeFormSchema(t).safeParse({ ...validCharge, status: 'paid' }).success).toBe(
      false,
    )
  })
})

describe('register payment schema', () => {
  const schema = createRegisterPaymentSchema(t)
  const base = { paymentDate: '2026-10-08', paymentMethod: 'PIX', receipt: null }

  it('accepts a payment without a receipt', () => {
    expect(schema.safeParse(base).success).toBe(true)
  })

  it('requires the date and payment method', () => {
    expect(errorsOf(schema.safeParse({ ...base, paymentDate: '', paymentMethod: ' ' }))).toEqual([
      'dateInvalid',
      'paymentMethodRequired',
    ])
  })

  it('accepts PDF, JPG and PNG up to 10 MB', () => {
    for (const type of ['application/pdf', 'image/jpeg', 'image/png']) {
      const receipt = new File(['x'], 'comprovante', { type })
      expect(schema.safeParse({ ...base, receipt }).success).toBe(true)
    }
  })

  it('rejects other formats and files above 10 MB', () => {
    const word = new File(['x'], 'comprovante.docx', { type: 'application/msword' })
    expect(errorsOf(schema.safeParse({ ...base, receipt: word }))).toEqual(['receiptType'])

    const big = new File(['x'], 'comprovante.pdf', { type: 'application/pdf' })
    Object.defineProperty(big, 'size', { value: RECEIPT_MAX_BYTES + 1 })
    expect(errorsOf(schema.safeParse({ ...base, receipt: big }))).toEqual(['receiptSize'])
  })
})

describe('charge reason schema', () => {
  it('requires at least 3 characters after trimming and at most 500', () => {
    const schema = createChargeReasonSchema(t)
    expect(errorsOf(schema.safeParse({ reason: '  ab ' }))).toEqual(['reasonRequired'])
    expect(errorsOf(schema.safeParse({ reason: 'x'.repeat(501) }))).toEqual(['reasonTooLong'])
    expect(schema.parse({ reason: '  Pix devolvido ' }).reason).toBe('Pix devolvido')
  })
})
