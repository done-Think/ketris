import { buildSitemapEntries, getRecordHref, serializeSitemap } from '@/i18n/sitemaps'
import {
  countPublicSitemapRecords,
  listPublicSitemapRecords,
} from '@server/marketplace/infrastructure/prisma-sitemap.reader'
import { isSitemapKind, sitemapPageSize } from '@server/marketplace/types/sitemap'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; page: string }> },
) {
  const { kind, page: pageSegment } = await params
  if (!isSitemapKind(kind) || !/^\d+\.xml$/.test(pageSegment)) {
    return new Response('Not Found', { status: 404 })
  }
  const page = Number(pageSegment.slice(0, -4))
  if (!Number.isSafeInteger(page) || page < 0 || page > Math.floor(2147483647 / sitemapPageSize)) {
    return new Response('Not Found', { status: 404 })
  }
  const counts = await countPublicSitemapRecords()
  if (page >= Math.ceil(counts[kind] / sitemapPageSize)) {
    return new Response('Not Found', { status: 404 })
  }
  const records = await listPublicSitemapRecords(kind, page)
  const entries = records.flatMap((record) =>
    buildSitemapEntries(getRecordHref(kind, record), record.updatedAt),
  )
  return new Response(serializeSitemap(entries), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
