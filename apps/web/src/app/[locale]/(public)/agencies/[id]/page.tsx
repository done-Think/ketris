import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

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

export async function generateMetadata({ params }: AgencyPageProps) {
  const t = await getTranslations('marketplace.metadata')
  const agency = getAgencyById(params.id)

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

export default function AgencyPage({ params }: AgencyPageProps) {
  const agency = getAgencyById(params.id)

  if (!agency) notFound()

  return <AgencyPublicProfilePage agency={agency} />
}
