import { beforeEach, describe, expect, it, vi } from 'vitest'

const { countRecords, listRecords } = vi.hoisted(() => ({
  countRecords: vi.fn(),
  listRecords: vi.fn(),
}))
vi.mock('@server/marketplace/infrastructure/prisma-sitemap.reader', () => ({
  countPublicSitemapRecords: countRecords,
  listPublicSitemapRecords: listRecords,
}))

import { GET } from '@/app/sitemaps/[kind]/[page]/route'

describe('bounded public sitemap endpoints', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['users', '0.xml'],
    ['properties', '-1.xml'],
    ['properties', '1.5.xml'],
    ['brokers', '9007199254740991.xml'],
    ['agencies', '0'],
  ])('rejects unsupported kind/page %s/%s before accessing the database', async (kind, page) => {
    const response = await GET(new Request('http://localhost/sitemaps/invalid'), {
      params: Promise.resolve({ kind, page }),
    })
    expect(response.status).toBe(404)
    expect(countRecords).not.toHaveBeenCalled()
    expect(listRecords).not.toHaveBeenCalled()
  })

  it('rejects shards beyond the current count without reading rows', async () => {
    countRecords.mockResolvedValue({ properties: 1000, brokers: 0, agencies: 0 })
    const response = await GET(new Request('http://localhost/sitemaps/properties/1.xml'), {
      params: Promise.resolve({ kind: 'properties', page: '1.xml' }),
    })
    expect(response.status).toBe(404)
    expect(listRecords).not.toHaveBeenCalled()
  })
})
