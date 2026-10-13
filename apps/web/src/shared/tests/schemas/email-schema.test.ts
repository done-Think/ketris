import { describe, expect, it } from 'vitest'

import { createEmailSchema } from '../../schemas/email-schema'

const schema = createEmailSchema((key) => key)

describe('emailSchema', () => {
  it('trims whitespace and lowercases the value', () => {
    expect(schema.parse('  Admin@Ketris.Dev  ')).toBe('admin@ketris.dev')
  })

  it('rejects an empty value', () => {
    expect(schema.safeParse('').success).toBe(false)
  })

  it('rejects a malformed email', () => {
    expect(schema.safeParse('not-an-email').success).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createEmailSchema((key) => `translated:${key}`)

    expect(translated.safeParse('').error?.issues[0]?.message).toBe('translated:emailRequired')
    expect(translated.safeParse('not-an-email').error?.issues[0]?.message).toBe(
      'translated:emailInvalid',
    )
  })
})
