import type { Metadata } from 'next'
import { Suspense } from 'react'

import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { FavoritesPage } from '@modules/marketplace'

export const generateMetadata = async ({ params }: LocaleRoutePageProps): Promise<Metadata> => {
  const { locale } = await params

  return {
    ...(await createLocalizedMetadata('marketplace.metadata.favorites', locale)),
    robots: { index: false, follow: false },
  }
}

export default function FavoritesRoutePage() {
  return (
    <Suspense>
      <FavoritesPage />
    </Suspense>
  )
}
