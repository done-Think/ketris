import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { marketplaceContainer } from '@server/marketplace/container'
import { BrokerProfileNotFoundError } from '@server/marketplace/domain/errors'
import { BrokerPublicProfilePage } from '@modules/marketplace'
import { toBrokerProfile } from '@modules/marketplace/utils/broker-profile-adapter'

const getBroker = cache(async (id: string) => {
  try {
    const profile = await marketplaceContainer.getBrokerProfileUseCase.execute({ id })

    return toBrokerProfile({
      ...profile,
      publishedAt: profile.publishedAt?.toISOString() ?? null,
    })
  } catch (error) {
    if (error instanceof BrokerProfileNotFoundError) return null

    throw error
  }
})

export async function generateMetadata({ params }: LocaleRoutePageProps<{ id: string }>) {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketplace.metadata' })
  const broker = await getBroker(id)

  if (!broker) {
    return {
      title: t('brokerNotFound.metadataTitle'),
    }
  }

  return {
    title: `Ketris | ${broker.name}`,
    description: t('details.brokerDescription', {
      name: broker.name,
      creci: broker.creci ?? '',
      region: broker.region ?? '',
    }),
  }
}

export default async function BrokerPage({ params }: LocaleRoutePageProps<{ id: string }>) {
  const { id } = await params
  const broker = await getBroker(id)

  if (!broker) notFound()

  return <BrokerPublicProfilePage broker={broker} />
}
