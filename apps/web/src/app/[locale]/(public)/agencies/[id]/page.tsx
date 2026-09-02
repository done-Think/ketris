import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { locales } from '@/i18n/routing'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { AgencyPublicProfilePage } from '@modules/marketplace'
import { agencies, getAgencyById } from '@modules/marketplace/data/agencies'

export function generateStaticParams() {
  return locales.flatMap((locale) => agencies.map((agency) => ({ locale, id: agency.id })))
}

export async function generateMetadata({ params }: LocaleRoutePageProps<{ id: string }>) {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketplace.metadata' })
  const agency = getAgencyById(id)

  if (!agency) {
    return {
      title: t('agencyNotFound.metadataTitle'),
    }
  }

  return {
    title: `Ketris | ${agency.name}`,
    description: t('details.agencyDescription', {
      name: agency.name,
      creci: agency.legalCreci,
      headquarters: agency.headquarters,
    }),
  }
}

export default async function AgencyPage({ params }: LocaleRoutePageProps<{ id: string }>) {
  const { id } = await params
  const agency = getAgencyById(id)

  if (!agency) notFound()

  return <AgencyPublicProfilePage agency={agency} />
}
