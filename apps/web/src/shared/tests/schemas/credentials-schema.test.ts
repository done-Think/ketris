import { describe, expect, it } from 'vitest'

import { createCredentialsSchema } from '../../schemas/credentials-schema'

const schema = createCredentialsSchema((key) => key)

describe('credentialsSchema', () => {
  it('accepts a valid email and non-empty password, normalizing the email', () => {
    const result = schema.parse({ email: '  Admin@Ketris.Dev  ', password: 'secret' })

    expect(result).toEqual({ email: 'admin@ketris.dev', password: 'secret' })
  })

  it('rejects a malformed email', () => {
    expect(schema.safeParse({ email: 'not-an-email', password: 'secret' }).success).toBe(false)
  })

  it('rejects an empty password', () => {
    expect(schema.safeParse({ email: 'admin@ketris.dev', password: '' }).success).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createCredentialsSchema((key) => `translated:${key}`)
    const result = translated.safeParse({ email: 'admin@ketris.dev', password: '' })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:passwordRequired',
    )
  })
})
