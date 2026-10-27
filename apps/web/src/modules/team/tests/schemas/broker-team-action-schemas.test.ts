import { describe, expect, it } from 'vitest'

import {
  createAcceptInvitationSchema,
  createBrokerDeactivateSchema,
  createBrokerGoalSchema,
  createBrokerInviteSchema,
  createBrokerTransferSchema,
} from '../../schemas/broker-team-action-schemas'

const translate = (key: string) => key
const goalSchema = createBrokerGoalSchema(translate)
const transferSchema = createBrokerTransferSchema(translate)
const deactivateSchema = createBrokerDeactivateSchema(translate)
const inviteSchema = createBrokerInviteSchema(translate)
const acceptSchema = createAcceptInvitationSchema(translate)

describe('broker team action schemas', () => {
  it('accepts whole monthly goals between 1 and 10000', () => {
    expect(goalSchema.parse({ monthlySales: '5' })).toEqual({ monthlySales: 5 })
    expect(goalSchema.safeParse({ monthlySales: 0 }).success).toBe(false)
    expect(goalSchema.safeParse({ monthlySales: 1.5 }).success).toBe(false)
    expect(goalSchema.safeParse({ monthlySales: 10001 }).success).toBe(false)
  })

  it('requires a destination and at least one item to transfer', () => {
    const valid = { destinationId: 'b', properties: false, leads: true, futureEvents: false }

    expect(transferSchema.safeParse(valid).success).toBe(true)
    expect(transferSchema.safeParse({ ...valid, destinationId: '' }).success).toBe(false)
    expect(transferSchema.safeParse({ ...valid, leads: false }).error?.issues[0]).toMatchObject({
      path: ['properties'],
      message: 'itemsError',
    })
    expect(transferSchema.safeParse({ ...valid, leads: false, futureEvents: true }).success).toBe(
      true,
    )
  })

  it('requires a destination to deactivate', () => {
    expect(deactivateSchema.safeParse({ destinationId: '' }).success).toBe(false)
    expect(deactivateSchema.safeParse({ destinationId: 'b' }).success).toBe(true)
  })

  it('invites with only name and e-mail', () => {
    expect(inviteSchema.parse({ name: ' Bruno ', email: ' bruno@ketris.dev ' })).toEqual({
      name: 'Bruno',
      email: 'bruno@ketris.dev',
    })
    expect(inviteSchema.safeParse({ name: '   ', email: 'bruno@ketris.dev' }).success).toBe(false)
    expect(inviteSchema.safeParse({ name: 'Bruno', email: 'bruno' }).success).toBe(false)
  })

  it('requires a matching password of at least 8 characters to accept the invitation', () => {
    expect(
      acceptSchema.safeParse({ password: 'senha-forte', passwordConfirmation: 'senha-forte' })
        .success,
    ).toBe(true)
    expect(
      acceptSchema.safeParse({ password: 'curta', passwordConfirmation: 'curta' }).success,
    ).toBe(false)
    expect(
      acceptSchema.safeParse({ password: 'senha-forte', passwordConfirmation: 'outra-senha' }).error
        ?.issues[0]?.message,
    ).toBe('passwordMismatch')
  })
})
