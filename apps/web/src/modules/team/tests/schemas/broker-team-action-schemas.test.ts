import { describe, expect, it } from 'vitest'

import {
  createBrokerGoalSchema,
  createBrokerInviteSchema,
  createBrokerTransferSchema,
} from '../../schemas/broker-team-action-schemas'

const brokerGoalSchema = createBrokerGoalSchema((key) => key)
const brokerTransferSchema = createBrokerTransferSchema((key) => key)
const brokerInviteSchema = createBrokerInviteSchema((key) => key)

describe('broker action validation', () => {
  it('requires a positive whole-number monthly goal', () => {
    expect(brokerGoalSchema.safeParse({ monthlyGoal: 15 }).success).toBe(true)
    expect(brokerGoalSchema.safeParse({ monthlyGoal: 0 }).success).toBe(false)
    expect(brokerGoalSchema.safeParse({ monthlyGoal: 1.5 }).success).toBe(false)
  })

  it('requires destination and at least one transferable category', () => {
    expect(
      brokerTransferSchema.safeParse({ destinationId: '', leads: true, properties: false }).success,
    ).toBe(false)
    expect(
      brokerTransferSchema.safeParse({ destinationId: 'thiago', leads: false, properties: false })
        .success,
    ).toBe(false)
    expect(
      brokerTransferSchema.safeParse({ destinationId: 'thiago', leads: true, properties: false })
        .success,
    ).toBe(true)
  })
})

describe('broker invite validation', () => {
  it('requires name, a valid e-mail and a strong password', () => {
    const valid = { name: 'Bruno Lima', email: 'bruno@ketris.dev', password: 'Senha#2026' }

    expect(brokerInviteSchema.safeParse(valid).success).toBe(true)
    expect(brokerInviteSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false)
    expect(brokerInviteSchema.safeParse({ ...valid, email: 'bruno' }).success).toBe(false)
    expect(brokerInviteSchema.safeParse({ ...valid, password: 'Sen#26' }).success).toBe(false)
    expect(brokerInviteSchema.safeParse({ ...valid, password: 'senha#2026' }).success).toBe(false)
    expect(brokerInviteSchema.safeParse({ ...valid, password: 'SENHA#2026' }).success).toBe(false)
    expect(brokerInviteSchema.safeParse({ ...valid, password: 'Senha#Forte' }).success).toBe(false)
    expect(brokerInviteSchema.safeParse({ ...valid, password: 'Senha2026' }).success).toBe(false)
  })
})
