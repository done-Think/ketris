import { describe, expect, it } from 'vitest'

import { createBrokerInviteSchema } from '../../schemas/broker-team-action-schemas'
import {
  generateTemporaryPassword,
  temporaryPasswordLength,
} from '../../utils/generate-temporary-password'

const brokerInviteSchema = createBrokerInviteSchema((key) => key)

describe('generateTemporaryPassword', () => {
  it('always includes uppercase, lowercase, number and special character', () => {
    for (let run = 0; run < 500; run += 1) {
      const password = generateTemporaryPassword()

      expect(password).toHaveLength(temporaryPasswordLength)
      expect(password).toMatch(/[A-Z]/)
      expect(password).toMatch(/[a-z]/)
      expect(password).toMatch(/\d/)
      expect(password).toMatch(/[^A-Za-z0-9]/)
      expect(password).not.toMatch(/[0O1lI]/)
    }
  })

  it('produces passwords accepted by the invite schema', () => {
    const password = generateTemporaryPassword()

    expect(
      brokerInviteSchema.safeParse({ name: 'Bruno', email: 'bruno@ketris.dev', password }).success,
    ).toBe(true)
  })

  it('does not repeat passwords between calls', () => {
    const passwords = new Set(Array.from({ length: 200 }, () => generateTemporaryPassword()))

    expect(passwords.size).toBe(200)
  })
})
