import { describe, expect, it } from 'vitest'
import { parse } from '@formatjs/icu-messageformat-parser'

import pt from '@/i18n/messages/pt-BR/face_check.json'
import en from '@/i18n/messages/en-US/face_check.json'
import es from '@/i18n/messages/es-ES/face_check.json'

function flatten(messages: Record<string, unknown>, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(messages).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key
      return typeof value === 'string'
        ? [[path, value]]
        : Object.entries(flatten(value as Record<string, unknown>, path))
    }),
  )
}

describe('face_check translations', () => {
  it('uses valid ICU syntax in all three languages', () => {
    for (const messages of [pt, en, es]) {
      for (const value of Object.values(flatten(messages))) expect(() => parse(value)).not.toThrow()
    }
  })
  it('provides every message and interpolation in Portuguese, English and Spanish', () => {
    const source = flatten(pt)
    for (const messages of [en, es]) {
      const translated = flatten(messages)
      expect(Object.keys(translated).sort()).toEqual(Object.keys(source).sort())
      for (const [key, value] of Object.entries(source)) {
        expect(translated[key].trim(), key).not.toBe('')
        expect(translated[key].match(/\{\w+\}/g)?.sort() ?? [], key).toEqual(
          value.match(/\{\w+\}/g)?.sort() ?? [],
        )
      }
    }
  })
})
