import { describe, expect, it } from 'vitest'

import { calculateMonthlyCharge, isBillableTenant, usageUnitFor } from '../../domain/platform-plan'
import type { PlatformPlan } from '../../types/platform-plan'

const updatedAt = new Date('2026-10-15T00:00:00.000Z')
const individual: PlatformPlan = {
  accountType: 'INDIVIDUAL',
  monthlyPrice: 49.99,
  includedUnits: 10,
  extraUnitPrice: 9.99,
  createdAt: updatedAt,
  updatedAt,
  updatedBy: null,
}
const broker: PlatformPlan = { ...individual, accountType: 'BROKER', monthlyPrice: 99.99 }
const agency: PlatformPlan = {
  accountType: 'AGENCY',
  monthlyPrice: 199.99,
  includedUnits: 10,
  extraUnitPrice: 19.99,
  createdAt: updatedAt,
  updatedAt,
  updatedBy: null,
}

describe('calculateMonthlyCharge', () => {
  it('cobra só o preço base até o limite incluso', () => {
    expect(calculateMonthlyCharge(broker, { properties: 0, brokers: 3 }).total).toBe(99.99)
    expect(calculateMonthlyCharge(broker, { properties: 10, brokers: 3 })).toEqual({
      usageUnit: 'PROPERTIES',
      usage: 10,
      includedUnits: 10,
      extraUnits: 0,
      basePrice: 99.99,
      extraAmount: 0,
      total: 99.99,
    })
  })

  it('soma cada imóvel acima do limite para pessoa física e corretor', () => {
    expect(calculateMonthlyCharge(individual, { properties: 12, brokers: 0 })).toMatchObject({
      extraUnits: 2,
      extraAmount: 19.98,
      total: 69.97,
    })
    expect(calculateMonthlyCharge(broker, { properties: 11, brokers: 50 }).total).toBe(109.98)
  })

  it('conta corretores ativos, e não imóveis, para imobiliária', () => {
    expect(calculateMonthlyCharge(agency, { properties: 500, brokers: 13 })).toEqual({
      usageUnit: 'BROKERS',
      usage: 13,
      includedUnits: 10,
      extraUnits: 3,
      basePrice: 199.99,
      extraAmount: 59.97,
      total: 259.96,
    })
  })

  it('soma em centavos sem erro de ponto flutuante', () => {
    const charge = calculateMonthlyCharge(individual, { properties: 110, brokers: 0 })

    expect(charge.extraAmount).toBe(999)
    expect(charge.total).toBe(1048.99)
  })

  it('aceita limite zero (todo uso é extra)', () => {
    expect(
      calculateMonthlyCharge({ ...broker, includedUnits: 0 }, { properties: 1, brokers: 0 }).total,
    ).toBe(109.98)
  })
})

describe('usageUnitFor', () => {
  it('usa corretores para imobiliária e imóveis para os demais', () => {
    expect(usageUnitFor('AGENCY')).toBe('BROKERS')
    expect(usageUnitFor('BROKER')).toBe('PROPERTIES')
    expect(usageUnitFor('INDIVIDUAL')).toBe('PROPERTIES')
  })
})

describe('isBillableTenant', () => {
  it('não cobra o tenant de sistema dos locatários', () => {
    expect(isBillableTenant('locatarios')).toBe(false)
    expect(isBillableTenant('imobiliaria-horizonte')).toBe(true)
  })
})
