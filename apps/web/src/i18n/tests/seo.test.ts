import { beforeEach, describe, expect, it, vi } from 'vitest'

const { configuration } = vi.hoisted(() => ({
  configuration: { appUrl: 'https://ketris.example', environment: 'production' },
}))
vi.mock('@config/env', () => ({ env: configuration }))
vi.unmock('@/i18n/navigation')

import { getCurrentRouteHref, getLocaleChangePathname } from '../current-route'
import { getPathname } from '../navigation'
import {
  getAgencyProfileHref,
  getPublicAlternates,
  isPublicIndexingEnabled,
  privateMetadata,
  publicMetadata,
} from '../seo'
import { buildSitemapEntries, getSitemapLocations, serializeSitemap } from '../sitemaps'

describe('localized SEO and navigation', () => {
  beforeEach(() => {
    configuration.appUrl = 'https://ketris.example'
    configuration.environment = 'production'
    vi.stubEnv('VERCEL_ENV', undefined)
  })

  it('generates canonical and alternate URLs from the routing source', () => {
    expect(
      getPublicAlternates('es-ES', { pathname: '/properties/[id]', params: { id: 'property-1' } }),
    ).toEqual({
      canonical: 'https://ketris.example/es/inmuebles/property-1',
      languages: {
        'pt-BR': 'https://ketris.example/pt/imoveis/property-1',
        'en-US': 'https://ketris.example/en/properties/property-1',
        'es-ES': 'https://ketris.example/es/inmuebles/property-1',
        'x-default': 'https://ketris.example/pt/imoveis/property-1',
      },
    })
  })

  it('preserves dynamic params, repeated query filters and fragment during locale changes', () => {
    const href = getCurrentRouteHref(
      '/agencies/[id]/[creci]',
      { id: 'alameda-prime', creci: '12345' },
      new URLSearchParams('q=one&q=two'),
    )
    expect(getLocaleChangePathname('es-ES', href, '#team')).toBe(
      '/es/inmobiliarias/alameda-prime/12345?q=one&q=two#team',
    )
  })

  it('keeps private URLs stable across languages while translating public SEO routes', () => {
    expect(getPathname({ locale: 'en-US', href: '/dashboard/agenda' })).toBe('/en/dashboard/agenda')
    expect(getPathname({ locale: 'pt-BR', href: '/brokers' })).toBe('/pt/corretores')
    expect(privateMetadata.robots).toEqual({ index: false, follow: false })
  })

  it('disables indexing for staging, preview and local hosts', () => {
    expect(isPublicIndexingEnabled()).toBe(true)
    configuration.environment = 'staging'
    expect(isPublicIndexingEnabled()).toBe(false)
    configuration.environment = 'production'
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(publicMetadata('pt-BR', '/').robots).toEqual({ index: false, follow: false })
    vi.stubEnv('VERCEL_ENV', undefined)
    configuration.appUrl = 'http://localhost:3000'
    expect(isPublicIndexingEnabled()).toBe(false)
  })

  it('uses the pretty agency URL as canonical with an ID fallback for legacy profiles', () => {
    expect(getAgencyProfileHref('Alameda Prime', 'CRECI J-12345', 'tenant-1')).toEqual({
      pathname: '/agencies/[id]/[creci]',
      params: { id: 'alameda-prime', creci: '12345' },
    })
    expect(getAgencyProfileHref('Legacy', null, 'tenant-1')).toEqual({
      pathname: '/agencies/[id]',
      params: { id: 'tenant-1' },
    })
  })

  it('advertises every bounded sitemap shard and preserves XML alternates', () => {
    expect(getSitemapLocations({ properties: 1001, brokers: 0, agencies: 1 })).toEqual([
      'https://ketris.example/sitemap.xml',
      'https://ketris.example/sitemaps/properties/0.xml',
      'https://ketris.example/sitemaps/properties/1.xml',
      'https://ketris.example/sitemaps/agencies/0.xml',
    ])
    const xml = serializeSitemap(buildSitemapEntries('/brokers', new Date('2026-10-27T00:00:00Z')))
    expect(xml).toContain('<loc>https://ketris.example/pt/corretores</loc>')
    expect(xml).toContain('hreflang="en-US" href="https://ketris.example/en/brokers"')
    expect(xml).toContain('<lastmod>2026-10-27T00:00:00.000Z</lastmod>')
    expect(serializeSitemap([{ url: 'https://ketris.example/?a=1&b=2' }])).toContain('?a=1&amp;b=2')
  })
})
