import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { locales } from '@/i18n/routing'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { BrokerPublicProfilePage } from '@modules/marketplace'
import { brokers, getBrokerById } from '@modules/marketplace/data/brokers'

export function generateStaticParams() {
  return locales.flatMap((locale) => brokers.map((broker) => ({ locale, id: broker.id })))
}

export async function generateMetadata({ params }: LocaleRoutePageProps<{ id: string }>) {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketplace.metadata' })
  const broker = getBrokerById(id)

  if (!broker) {
    return {
      title: t('brokerNotFound.metadataTitle'),
    }
  }

  return {
    title: `Ketris | ${broker.name}`,
    description: t('details.brokerDescription', {
      name: broker.name,
      creci: broker.creci,
      region: broker.region,
    }),
  }
}

export default async function BrokerPage({ params }: LocaleRoutePageProps<{ id: string }>) {
  const { id } = await params
  const broker = getBrokerById(id)

  if (!broker) notFound()

  return <BrokerPublicProfilePage broker={broker} />
}
