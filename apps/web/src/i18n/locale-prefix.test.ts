import { describe, expect, it } from 'vitest'

import {
  getLocaleFromPathname,
  getLocalizedPathname,
  getLocalizedPathnameForLocale,
} from './locale-prefix'

describe('locale-prefix', () => {
  it('adds the configured locale prefix to canonical routes', () => {
    expect(getLocalizedPathname('/login', 'pt-BR')).toBe('/pt/login')
    expect(getLocalizedPathname('/login', 'en-US')).toBe('/en/login')
    expect(getLocalizedPathname('/login', 'es-ES')).toBe('/es/login')
  })

  it('detects the active locale from prefixed pathnames', () => {
    expect(getLocaleFromPathname('/pt/imoveis')).toBe('pt-BR')
    expect(getLocaleFromPathname('/en/properties')).toBe('en-US')
    expect(getLocaleFromPathname('/es/inmuebles')).toBe('es-ES')
  })

  it('switches from Portuguese root to English root without nesting prefixes', () => {
    expect(getLocalizedPathnameForLocale('/pt', 'en-US')).toBe('/en')
  })

  it('switches public translated routes while preserving the current slug', () => {
    expect(getLocalizedPathnameForLocale('/pt/imoveis/apartamento-garden', 'en-US')).toBe(
      '/en/properties/apartamento-garden',
    )
    expect(getLocalizedPathnameForLocale('/en/brokers/marina-costa', 'pt-BR')).toBe(
      '/pt/corretores/marina-costa',
    )
    expect(getLocalizedPathnameForLocale('/en/agencies/lopes-prime', 'es-ES')).toBe(
      '/es/inmobiliarias/lopes-prime',
    )
  })
})
