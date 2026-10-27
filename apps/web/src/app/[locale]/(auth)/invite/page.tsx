import { getTranslations } from 'next-intl/server'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { AcceptInvitationScreen } from '@modules/team/components/AcceptInvitationScreen'

export async function generateMetadata({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard.team.invitationPage' })
  return { title: t('title'), robots: { index: false, follow: false }, referrer: 'no-referrer' }
}

export default async function TeamInvitationPage({ searchParams }: LocaleRoutePageProps) {
  const token = (await searchParams)?.token
  return <AcceptInvitationScreen token={typeof token === 'string' && token.trim() ? token : null} />
}
