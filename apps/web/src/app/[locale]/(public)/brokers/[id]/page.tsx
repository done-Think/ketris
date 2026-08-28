import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { BrokerPublicProfilePage } from '@modules/marketplace'
import { brokers, getBrokerById } from '@modules/marketplace/data/brokers'

type BrokerPageProps = {
  params: {
    id: string
  }
}

export function generateStaticParams() {
  return brokers.map((broker) => ({ id: broker.id }))
}

export async function generateMetadata({ params }: BrokerPageProps) {
  const t = await getTranslations('marketplace.metadata')
  const broker = getBrokerById(params.id)

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

export default function BrokerPage({ params }: BrokerPageProps) {
  const broker = getBrokerById(params.id)

  if (!broker) notFound()

  return <BrokerPublicProfilePage broker={broker} />
}
