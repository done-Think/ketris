import { describe, expect, it } from 'vitest'

import { credentialsSchema } from './credentials-schema'

describe('credentialsSchema', () => {
  it('accepts a valid email and non-empty password, normalizing the email', () => {
    const result = credentialsSchema.parse({ email: '  Admin@Ketris.Dev  ', password: 'secret' })

    expect(result).toEqual({ email: 'admin@ketris.dev', password: 'secret' })
  })

  it('rejects a malformed email', () => {
    expect(credentialsSchema.safeParse({ email: 'not-an-email', password: 'secret' }).success).toBe(
      false,
    )
  })

  it('rejects an empty password', () => {
    expect(credentialsSchema.safeParse({ email: 'admin@ketris.dev', password: '' }).success).toBe(
      false,
    )
  })
})
