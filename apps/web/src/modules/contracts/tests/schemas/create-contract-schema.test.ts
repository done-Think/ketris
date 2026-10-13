import { describe, expect, it } from 'vitest'

import { createContractSchema } from '../../schemas/create-contract-schema'

const schema = createContractSchema((key) => key)

const validValues = {
  activeStepIndex: 0,
  maxStepIndex: 0,
  opportunityId: 'opportunity-1',
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
  contractType: 'RESIDENCIAL',
  dueDay: '05',
  startDate: '01/09/2026',
  endDate: '31/08/2029',
  guaranteeType: 'CAUCAO',
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
      guaranteeType: 'FIADOR',
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
      guaranteeType: 'CAUCAO',
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
      guaranteeType: 'FIADOR',
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
})
