import { describe, expect, it } from 'vitest'
import { createContractSchema } from '../../schemas/create-contract-schema'

const schema = createContractSchema((key) => key)

const validValues = {
  opportunityId: 'opportunity-1',
  amount: 2450.75,
  ownerName: 'Carlos Eduardo Mendes',
  ownerCpf: '529.982.247-25',
  ownerEmail: 'carlos@example.com',
  ownerPhone: '(11) 99999-9999',
  tenantName: 'Bruno Oliveira',
  tenantCpf: '987.654.321-00',
  tenantEmail: 'bruno@example.com',
  tenantPhone: '(11) 99999-9999',
  hasGuarantor: false,
  guarantorName: '',
  guarantorCpf: '',
  guarantorEmail: '',
  guarantorPhone: '',
  contractType: 'RESIDENTIAL',
  dueDay: '05',
  startDate: '01/09/2026',
  endDate: '31/08/2029',
  guaranteeType: 'DEPOSIT',
  adjustmentIndex: 'IPCA',
  notes: '',
}

describe('createContractSchema', () => {
  it('accepts a fully filled, valid contract', () => {
    const result = schema.safeParse(validValues)

    expect(result.success).toBe(true)
  })

  it('rejects missing opportunity and parties fields', () => {
    const result = schema.safeParse({
      ...validValues,
      opportunityId: '',
      ownerName: '',
      tenantEmail: 'email-invalido',
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing contract condition fields', () => {
    const result = schema.safeParse({
      ...validValues,
      dueDay: '',
      startDate: '',
      guaranteeType: '',
    })

    expect(result.success).toBe(false)
  })

  it('requires guarantor fields when guarantor registration is enabled', () => {
    const result = schema.safeParse({
      ...validValues,
      hasGuarantor: true,
      guarantorName: '',
      guarantorCpf: '',
      guarantorEmail: '',
      guarantorPhone: '',
    })

    expect(result.success).toBe(false)
  })

  it('requires guarantor fields when guaranteeType is FIADOR even without hasGuarantor', () => {
    const result = schema.safeParse({
      ...validValues,
      hasGuarantor: false,
      guaranteeType: 'GUARANTOR',
      guarantorName: '',
      guarantorCpf: '',
      guarantorEmail: '',
      guarantorPhone: '',
    })

    expect(result.success).toBe(false)
  })

  it('does not require guarantor fields when guaranteeType is not FIADOR', () => {
    const result = schema.safeParse({
      ...validValues,
      hasGuarantor: false,
      guaranteeType: 'DEPOSIT',
      guarantorName: '',
      guarantorCpf: '',
      guarantorEmail: '',
      guarantorPhone: '',
    })

    expect(result.success).toBe(true)
  })

  it('accepts a filled guarantor when guaranteeType is FIADOR', () => {
    const result = schema.safeParse({
      ...validValues,
      hasGuarantor: true,
      guaranteeType: 'GUARANTOR',
      guarantorName: 'Fernanda Lima',
      guarantorCpf: '456.789.123-64',
      guarantorEmail: 'fernanda@example.com',
      guarantorPhone: '(11) 99999-9999',
    })

    expect(result.success).toBe(true)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createContractSchema((key) => `translated:${key}`)
    const result = translated.safeParse({ ...validValues, opportunityId: '' })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:opportunityRequired',
    )
  })
  it.each([
    { dueDay: '1.5' },
    { dueDay: '0' },
    { dueDay: '32' },
    { startDate: '31/02/2026' },
    { endDate: '31/02/2027' },
    { endDate: '01/09/2026' },
    { endDate: '31/08/2026' },
    { amount: 1.005 },
    { amount: 10000000000 },
    { amount: 0.001 },
    { ownerName: 'a'.repeat(201) },
    { notes: 'a'.repeat(10001) },
    { contractType: 'UNKNOWN' },
    { guaranteeType: 'UNKNOWN' },
    { adjustmentIndex: 'UNKNOWN' },
  ])('rejeita dados incompatíveis com as regras da API: %o', (invalid) => {
    expect(schema.safeParse({ ...validValues, ...invalid }).success).toBe(false)
  })

  it('preserva o valor máximo com centavos e datas válidas em ano bissexto', () => {
    const result = schema.safeParse({
      ...validValues,
      amount: 9999999999.99,
      startDate: '29/02/2028',
      endDate: '01/03/2028',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.amount).toBe(9999999999.99)
  })
})
