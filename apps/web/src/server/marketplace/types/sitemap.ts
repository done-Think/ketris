export type SitemapKind = 'properties' | 'brokers' | 'agencies'

export type PublicSitemapRecord = {
  id: string
  updatedAt: Date
  displayName?: string
  legalCreci?: string | null
}

export const sitemapPageSize = 1000

export function isSitemapKind(value: string): value is SitemapKind {
  return value === 'properties' || value === 'brokers' || value === 'agencies'
}
