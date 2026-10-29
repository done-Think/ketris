import { getTranslations } from 'next-intl/server'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { PublicEmailChangeScreen } from '@modules/auth/components/PublicEmailChangeScreen'

export async function generateMetadata({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common.profilePage.emailChange.public' })
  return { title: t('title'), robots: { index: false, follow: false }, referrer: 'no-referrer' }
}

export default async function ConfirmEmailChangePage({ searchParams }: LocaleRoutePageProps) {
  const requestId = (await searchParams)?.request
  return (
    <PublicEmailChangeScreen
      requestId={typeof requestId === 'string' && requestId.trim() ? requestId : null}
    />
  )
}
