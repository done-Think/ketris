import type { MetadataRoute } from 'next'

import type { PublicSitemapRecord, SitemapKind } from '@server/marketplace/types/sitemap'
import { sitemapPageSize } from '@server/marketplace/types/sitemap'
import type { NavigationHref } from './current-route'
import { locales } from './routing'
import { getAgencyProfileHref, getPublicAlternates, getSiteOrigin } from './seo'

export const publicDirectoryHrefs = ['/', '/properties', '/brokers', '/agencies'] as const

export function buildSitemapEntries(href: NavigationHref, updatedAt?: Date): MetadataRoute.Sitemap {
  return locales.map((locale) => {
    const alternates = getPublicAlternates(locale, href)
    return {
      url: alternates.canonical,
      ...(updatedAt ? { lastModified: updatedAt } : {}),
      alternates: { languages: alternates.languages },
    }
  })
}

export function getRecordHref(kind: SitemapKind, record: PublicSitemapRecord): NavigationHref {
  if (kind === 'properties') return { pathname: '/properties/[id]', params: { id: record.id } }
  if (record.handle) return { pathname: '/p/[handle]', params: { handle: record.handle } }
  if (kind === 'brokers') return { pathname: '/brokers/[id]', params: { id: record.id } }
  return getAgencyProfileHref(record.displayName ?? record.id, record.legalCreci ?? null, record.id)
}

export function getSitemapLocations(counts: Record<SitemapKind, number>) {
  const origin = getSiteOrigin()
  const locations = [new URL('/sitemap.xml', origin).href]
  for (const kind of ['properties', 'brokers', 'agencies'] as const) {
    const pages = Math.ceil(counts[kind] / sitemapPageSize)
    for (let page = 0; page < pages; page++) {
      locations.push(new URL(`/sitemaps/${kind}/${page}.xml`, origin).href)
    }
  }
  return locations
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&apos;'
    }
  })
}

export function serializeSitemap(entries: MetadataRoute.Sitemap) {
  const urls = entries.map((entry) => {
    const modified = entry.lastModified
      ? `<lastmod>${escapeXml(new Date(entry.lastModified).toISOString())}</lastmod>`
      : ''
    const languages = Object.entries(entry.alternates?.languages ?? {})
      .map(
        ([language, href]) =>
          `<xhtml:link rel="alternate" hreflang="${escapeXml(language)}" href="${escapeXml(String(href))}"/>`,
      )
      .join('')
    return `<url><loc>${escapeXml(entry.url)}</loc>${modified}${languages}</url>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`
}
