import type { MetadataRoute } from 'next'

import { getPathname } from '@/i18n/navigation'
import { locales } from '@/i18n/routing'
import { isPublicIndexingEnabled } from '@/i18n/seo'
import { getSitemapLocations } from '@/i18n/sitemaps'
import { countPublicSitemapRecords } from '@server/marketplace/infrastructure/prisma-sitemap.reader'

export const dynamic = 'force-dynamic'

const privateRoutes = [
  '/dashboard',
  '/crm',
  '/platform',
  '/login',
  '/register',
  '/forgot-password',
  '/confirm-email-change',
  '/invite',
  '/public-profile/edit-preview',
  '/public-profile/agency/edit-preview',
] as const

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!isPublicIndexingEnabled()) return { rules: { userAgent: '*', disallow: '/' } }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        ...locales.map((locale) =>
          getPathname({
            locale,
            href: { pathname: '/face_check/verify/[token]', params: { token: '*' } },
          }),
        ),
        ...locales.flatMap((locale) => privateRoutes.map((href) => getPathname({ locale, href }))),
      ],
    },
    sitemap: getSitemapLocations(await countPublicSitemapRecords()),
  }
}
