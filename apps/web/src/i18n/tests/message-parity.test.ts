import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser'
import { describe, expect, it } from 'vitest'

const catalogRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../messages')
const namespaces = readdirSync(path.join(catalogRoot, 'pt-BR')).filter((name) =>
  name.endsWith('.json'),
)

function messageEntries(value: unknown, prefix = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[prefix, value]]
  if (!value || typeof value !== 'object') throw new Error(`Invalid message at ${prefix}`)
  return Object.entries(value).flatMap(([key, message]) =>
    messageEntries(message, prefix ? `${prefix}.${key}` : key),
  )
}

function parameters(message: string) {
  const names = new Set<string>()
  function visit(elements: MessageFormatElement[]) {
    for (const element of elements) {
      if (element.type === TYPE.literal || element.type === TYPE.pound) continue
      if (element.type === TYPE.tag) {
        names.add(element.value)
        visit(element.children)
      } else {
        names.add(element.value)
        if (element.type === TYPE.plural || element.type === TYPE.select) {
          for (const option of Object.values(element.options)) visit(option.value)
        }
      }
    }
  }
  visit(parse(message))
  return [...names].sort()
}

describe('translation catalog parity', () => {
  it.each(namespaces)('keeps keys and interpolation parameters aligned in %s', (namespace) => {
    const reference = messageEntries(
      JSON.parse(readFileSync(path.join(catalogRoot, 'pt-BR', namespace), 'utf8')),
    )
    for (const locale of ['en-US', 'es-ES']) {
      const translated = messageEntries(
        JSON.parse(readFileSync(path.join(catalogRoot, locale, namespace), 'utf8')),
      )
      expect(translated.map(([key]) => key).sort(), locale).toEqual(
        reference.map(([key]) => key).sort(),
      )
      const byKey = new Map(translated)
      for (const [key, message] of reference) {
        expect(parameters(byKey.get(key) ?? ''), `${locale}:${key}`).toEqual(parameters(message))
      }
    }
  })
})
