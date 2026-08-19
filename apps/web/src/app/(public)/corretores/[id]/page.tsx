import { notFound } from 'next/navigation'

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

export function generateMetadata({ params }: BrokerPageProps) {
  const broker = getBrokerById(params.id)

  if (!broker) {
    return {
      title: 'Corretor nao encontrado | Ketris',
    }
  }

  return {
    title: `${broker.name} | Ketris`,
    description: `${broker.name}, ${broker.creci}, representa imoveis em ${broker.region}.`,
  }
}

export default function BrokerPage({ params }: BrokerPageProps) {
  const broker = getBrokerById(params.id)

  if (!broker) notFound()

  return <BrokerPublicProfilePage broker={broker} />
}
