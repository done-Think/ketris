import { afterEach, describe, expect, it, vi } from 'vitest'

import { formatPropertyRelativeDate } from '../../utils/format-property'

describe('formatPropertyRelativeDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats relative dates using the selected locale', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-06T12:00:00.000Z'))

    const value = '2026-10-06T11:28:00.000Z'

    expect(formatPropertyRelativeDate(value, 'pt-BR', true)).toBe('Há 32 minutos')
    expect(formatPropertyRelativeDate(value, 'en-US', true)).toBe('32 minutes ago')
    expect(formatPropertyRelativeDate(value, 'es-ES', true)).toBe('Hace 32 minutos')
  })
})
