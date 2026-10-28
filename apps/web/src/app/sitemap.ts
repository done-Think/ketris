import { buildSitemapEntries, publicDirectoryHrefs } from '@/i18n/sitemaps'

export default function sitemap() {
  return publicDirectoryHrefs.flatMap((href) => buildSitemapEntries(href))
}
