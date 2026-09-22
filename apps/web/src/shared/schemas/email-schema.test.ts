import { describe, expect, it } from 'vitest'

import { emailSchema } from './email-schema'

describe('emailSchema', () => {
  it('trims whitespace and lowercases the value', () => {
    expect(emailSchema.parse('  Admin@Ketris.Dev  ')).toBe('admin@ketris.dev')
  })

  it('rejects an empty value', () => {
    expect(emailSchema.safeParse('').success).toBe(false)
  })

  it('rejects a malformed email', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false)
  })
})
