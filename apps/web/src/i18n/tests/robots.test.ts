import { beforeEach, describe, expect, it, vi } from 'vitest'

const { configuration, countRecords } = vi.hoisted(() => ({
  configuration: { appUrl: 'https://ketris.example', environment: 'production' },
  countRecords: vi.fn(),
}))
vi.mock('@config/env', () => ({ env: configuration }))
vi.mock('@server/marketplace/infrastructure/prisma-sitemap.reader', () => ({
  countPublicSitemapRecords: countRecords,
}))

import robots from '@/app/robots'
import sitemap from '@/app/sitemap'

describe('public crawling policy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VERCEL_ENV', undefined)
    configuration.appUrl = 'https://ketris.example'
    configuration.environment = 'production'
  })

  it('disallows staging crawlers without querying the database or announcing sitemaps', async () => {
    configuration.environment = 'staging'
    expect(await robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } })
    expect(countRecords).not.toHaveBeenCalled()
  })

  it('uses actual locale prefixes for private routes and advertises all current public shards', async () => {
    countRecords.mockResolvedValue({ properties: 1001, brokers: 1, agencies: 0 })
    const policy = await robots()
    expect(policy.rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: expect.arrayContaining(['/api/', '/pt/dashboard', '/en/platform', '/es/login']),
    })
    expect(policy.sitemap).toEqual([
      'https://ketris.example/sitemap.xml',
      'https://ketris.example/sitemaps/properties/0.xml',
      'https://ketris.example/sitemaps/properties/1.xml',
      'https://ketris.example/sitemaps/brokers/0.xml',
    ])
  })

  it('builds only canonical public directories in the static sitemap without database access', () => {
    const entries = sitemap()
    expect(entries).toHaveLength(12)
    expect(entries.map(({ url }) => url)).toContain('https://ketris.example/es/inmobiliarias')
    expect(entries.some(({ url }) => /dashboard|platform|login/.test(url))).toBe(false)
    expect(countRecords).not.toHaveBeenCalled()
  })
})
