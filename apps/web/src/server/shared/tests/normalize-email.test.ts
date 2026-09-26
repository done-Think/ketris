import { describe, expect, it } from 'vitest'

import { normalizeEmail } from '../normalize-email'

describe('normalizeEmail', () => {
  it('trims whitespace and lowercases the value', () => {
    expect(normalizeEmail('  Admin@Ketris.Dev  ')).toBe('admin@ketris.dev')
  })

  it('is a no-op for an already-normalized email', () => {
    expect(normalizeEmail('admin@ketris.dev')).toBe('admin@ketris.dev')
  })
})
