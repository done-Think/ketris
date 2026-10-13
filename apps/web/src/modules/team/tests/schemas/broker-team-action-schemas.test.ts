import { describe, expect, it } from 'vitest'

import {
  createBrokerGoalSchema,
  createBrokerTransferSchema,
} from '../../schemas/broker-team-action-schemas'

const brokerGoalSchema = createBrokerGoalSchema((key) => key)
const brokerTransferSchema = createBrokerTransferSchema((key) => key)

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
