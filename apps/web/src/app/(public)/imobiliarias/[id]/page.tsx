import { notFound } from 'next/navigation'

import { AgencyPublicProfilePage } from '@modules/marketplace'
import { agencies, getAgencyById } from '@modules/marketplace/data/agencies'

type AgencyPageProps = {
  params: {
    id: string
  }
}

export function generateStaticParams() {
  return agencies.map((agency) => ({ id: agency.id }))
}

export function generateMetadata({ params }: AgencyPageProps) {
  const agency = getAgencyById(params.id)

  if (!agency) {
    return {
      title: 'Ketris | Imobiliária não encontrada',
    }
  }

  return {
    title: `Ketris | ${agency.name}`,
    description: `${agency.name}, ${agency.legalCreci}, atua em ${agency.headquarters}.`,
  }
}

export default function AgencyPage({ params }: AgencyPageProps) {
  const agency = getAgencyById(params.id)

  if (!agency) notFound()

  return <AgencyPublicProfilePage agency={agency} />
}
