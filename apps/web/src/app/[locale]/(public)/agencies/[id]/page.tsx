import { cache } from 'react'
import { notFound } from 'next/navigation'
import { redirect } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

import { getAgencyProfileHref, privateMetadata, publicMetadata } from '@/i18n/seo'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { marketplaceContainer } from '@server/marketplace/container'
import { AgencyProfileNotFoundError } from '@server/marketplace/domain/errors'
import { AgencyPublicProfilePage } from '@modules/marketplace'
import { toAgencyProfile } from '@modules/marketplace/utils/agency-profile-adapter'

const getAgency = cache(async (id: string, locale: string) => {
  try {
    const profile = await marketplaceContainer.getAgencyProfileUseCase.execute({ id })
    const tFeatures = await getTranslations({ locale, namespace: 'marketplace.propertyFeatures' })

    return toAgencyProfile(
      {
        ...profile,
        publishedAt: profile.publishedAt?.toISOString() ?? null,
      },
      locale as 'pt-BR' | 'en-US' | 'es-ES',
      tFeatures,
    )
  } catch (error) {
    if (error instanceof AgencyProfileNotFoundError) return null

    throw error
  }
})

const getAddress = cache((id: string) =>
  marketplaceContainer.profileAddressUseCase.findForProfile({ kind: 'agency', profileId: id }),
)

export async function generateMetadata({ params }: LocaleRoutePageProps<{ id: string }>) {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketplace.metadata' })
  const agency = await getAgency(id, locale)

  if (!agency) {
    return {
      ...privateMetadata,
      title: t('agencyNotFound.metadataTitle'),
    }
  }

  const address = await getAddress(agency.id)
  return {
    ...publicMetadata(
      locale,
      address
        ? { pathname: '/p/[handle]', params: { handle: address.handle } }
        : getAgencyProfileHref(agency.name, agency.legalCreci, agency.id),
    ),
    title: `Ketris | ${agency.name}`,
    description: t('details.agencyDescription', {
      name: agency.name,
      creci: agency.legalCreci ?? '',
      headquarters: agency.headquarters ?? '',
    }),
  }
}

export default async function AgencyPage({ params }: LocaleRoutePageProps<{ id: string }>) {
  const { id, locale } = await params
  const agency = await getAgency(id, locale)

  if (!agency) notFound()
  const address = await getAddress(agency.id)
  if (address)
    redirect({ locale, href: { pathname: '/p/[handle]', params: { handle: address.handle } } })

  return <AgencyPublicProfilePage agency={agency} />
}
