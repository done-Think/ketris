import { describe, expect, it } from 'vitest'

import { createContractDefaultValues, createContractSchema } from './create-contract-schema'

describe('createContractSchema', () => {
  it('accepts the contract creation defaults', () => {
    const result = createContractSchema.safeParse(createContractDefaultValues)

    expect(result.success).toBe(true)
  })

  it('rejects missing required parties and property fields', () => {
    const result = createContractSchema.safeParse({
      ...createContractDefaultValues,
      ownerName: '',
      tenantEmail: 'email-invalido',
      propertyAddress: '',
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing contract condition fields', () => {
    const result = createContractSchema.safeParse({
      ...createContractDefaultValues,
      monthlyRent: '',
      startDate: '',
      guaranteeType: '',
    })

    expect(result.success).toBe(false)
  })

  it('requires guarantor fields when guarantor registration is enabled', () => {
    const result = createContractSchema.safeParse({
      ...createContractDefaultValues,
      hasGuarantor: true,
      guarantorName: '',
      guarantorCpf: '',
      guarantorEmail: '',
      guarantorPhone: '',
    })

    expect(result.success).toBe(false)
  })

  it('requires guarantor fields when guaranteeType is Fiador even without hasGuarantor', () => {
    const result = createContractSchema.safeParse({
      ...createContractDefaultValues,
      hasGuarantor: false,
      guaranteeType: 'Fiador',
      guarantorName: '',
      guarantorCpf: '',
      guarantorEmail: '',
      guarantorPhone: '',
    })

    expect(result.success).toBe(false)
  })

  it('does not require guarantor fields when guaranteeType is not Fiador', () => {
    const result = createContractSchema.safeParse({
      ...createContractDefaultValues,
      hasGuarantor: false,
      guaranteeType: 'Caução',
      guarantorName: '',
      guarantorCpf: '',
      guarantorEmail: '',
      guarantorPhone: '',
    })

    expect(result.success).toBe(true)
  })
})
