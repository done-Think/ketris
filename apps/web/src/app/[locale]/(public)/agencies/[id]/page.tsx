import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { marketplaceContainer } from '@server/marketplace/container'
import { AgencyProfileNotFoundError } from '@server/marketplace/domain/errors'
import { AgencyPublicProfilePage } from '@modules/marketplace'
import { toAgencyProfile } from '@modules/marketplace/utils/agency-profile-adapter'

const getAgency = cache(async (id: string) => {
  try {
    const profile = await marketplaceContainer.getAgencyProfileUseCase.execute({ id })

    return toAgencyProfile({
      ...profile,
      publishedAt: profile.publishedAt?.toISOString() ?? null,
    })
  } catch (error) {
    if (error instanceof AgencyProfileNotFoundError) return null

    throw error
  }
})

export async function generateMetadata({ params }: LocaleRoutePageProps<{ id: string }>) {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketplace.metadata' })
  const agency = await getAgency(id)

  if (!agency) {
    return {
      title: t('agencyNotFound.metadataTitle'),
    }
  }

  return {
    title: `Ketris | ${agency.name}`,
    description: t('details.agencyDescription', {
      name: agency.name,
      creci: agency.legalCreci ?? '',
      headquarters: agency.headquarters ?? '',
    }),
  }
}

export default async function AgencyPage({ params }: LocaleRoutePageProps<{ id: string }>) {
  const { id } = await params
  const agency = await getAgency(id)

  if (!agency) notFound()

  return <AgencyPublicProfilePage agency={agency} />
}
