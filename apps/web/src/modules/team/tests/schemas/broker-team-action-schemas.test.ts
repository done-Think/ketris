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

  it('requires a source, a destination and at least one item to transfer', () => {
    const valid = {
      sourceId: 'a',
      destinationId: 'b',
      properties: false,
      leads: true,
      opportunities: false,
      futureEvents: false,
    }

    expect(transferSchema.safeParse(valid).success).toBe(true)
    expect(transferSchema.safeParse({ ...valid, destinationId: '' }).success).toBe(false)
    expect(transferSchema.safeParse({ ...valid, sourceId: '' }).success).toBe(false)
    expect(transferSchema.safeParse({ ...valid, leads: false }).error?.issues[0]).toMatchObject({
      path: ['properties'],
      message: 'itemsError',
    })
    expect(transferSchema.safeParse({ ...valid, leads: false, futureEvents: true }).success).toBe(
      true,
    )
    expect(transferSchema.safeParse({ ...valid, leads: false, opportunities: true }).success).toBe(
      true,
    )
  })

  it('requires a destination to deactivate', () => {
    expect(deactivateSchema.safeParse({ destinationId: '' }).success).toBe(false)
    expect(deactivateSchema.safeParse({ destinationId: 'b' }).success).toBe(true)
  })

  it('invites with only a name and an e-mail', () => {
    expect(inviteSchema.parse({ name: ' Bruno ', email: ' bruno@ketris.dev ' })).toEqual({
      name: 'Bruno',
      email: 'bruno@ketris.dev',
    })
    expect(inviteSchema.safeParse({ name: '   ', email: 'bruno@ketris.dev' }).success).toBe(false)
    expect(inviteSchema.safeParse({ name: 'Bruno', email: 'bruno' }).success).toBe(false)
  })

  it('requires a matching password of at least 8 characters to accept the invitation', () => {
    expect(
      acceptSchema.safeParse({
        password: 'senha-forte',
        passwordConfirmation: 'senha-forte',
        document: '529.982.247-25',
      }).success,
    ).toBe(true)
    expect(
      acceptSchema.safeParse({
        password: 'curta',
        passwordConfirmation: 'curta',
        document: '529.982.247-25',
      }).success,
    ).toBe(false)
    expect(
      acceptSchema.safeParse({
        password: 'senha-forte',
        passwordConfirmation: 'outra-senha',
        document: '529.982.247-25',
      }).error?.issues[0]?.message,
    ).toBe('passwordMismatch')
  })

  it('accepts a CPF or a CNPJ as the invited broker document and rejects anything else', () => {
    const base = { password: 'senha-forte', passwordConfirmation: 'senha-forte' }
    expect(acceptSchema.safeParse({ ...base, document: '529.982.247-25' }).success).toBe(true)
    expect(acceptSchema.safeParse({ ...base, document: '11.222.333/0001-81' }).success).toBe(true)
    expect(acceptSchema.safeParse({ ...base, document: '' }).success).toBe(false)
    expect(acceptSchema.safeParse({ ...base, document: '111.111.111-11' }).success).toBe(false)
    expect(acceptSchema.safeParse({ ...base, document: '11.222.333/0001-82' }).success).toBe(false)
  })
})
