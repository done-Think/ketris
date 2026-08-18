import { notFound } from 'next/navigation'

import { AgencyPublicProfilePage } from '@modules/marketplace'
import { agencies, getAgencyById } from '@modules/marketplace/data/agencies'
import type { AgencyPageProps } from '@modules/marketplace/types'

export function generateStaticParams() {
  return agencies.map((agency) => ({ id: agency.id }))
}

export function generateMetadata({ params }: AgencyPageProps) {
  const agency = getAgencyById(params.id)

  if (!agency) {
    return {
      title: 'Imobiliaria nao encontrada | Ketris',
    }
  }

  return {
    title: `${agency.name} | Ketris`,
    description: `${agency.name}, ${agency.legalCreci}, atua em ${agency.headquarters}.`,
  }
}

export default function AgencyPage({ params }: AgencyPageProps) {
  const agency = getAgencyById(params.id)

  if (!agency) notFound()

  return <AgencyPublicProfilePage agency={agency} />
}
