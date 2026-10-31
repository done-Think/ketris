import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { publicMetadata, privateMetadata } from '@/i18n/seo'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import type { AppLocale } from '@/i18n/types/locale.types'
import { marketplaceContainer } from '@server/marketplace/container'
import {
  AgencyProfileNotFoundError,
  BrokerProfileNotFoundError,
} from '@server/marketplace/domain/errors'
import { AgencyPublicProfilePage, BrokerPublicProfilePage } from '@modules/marketplace'
import { toAgencyProfile } from '@modules/marketplace/utils/agency-profile-adapter'
import { toBrokerProfile } from '@modules/marketplace/utils/broker-profile-adapter'

// Renaming must immediately release the previous address, including previously visited URLs.
export const dynamic = 'force-dynamic'

const getProfile = cache(async (handle: string, locale: AppLocale) => {
  const address = await marketplaceContainer.profileAddressUseCase.resolve(handle)
  if (!address) return null
  const tFeatures = await getTranslations({ locale, namespace: 'marketplace.propertyFeatures' })
  try {
    if (address.kind === 'broker') {
      const profile = await marketplaceContainer.getBrokerProfileUseCase.execute({
        id: address.profileId,
      })
      return {
        kind: 'broker' as const,
        handle: address.handle,
        profile: toBrokerProfile(
          { ...profile, publishedAt: profile.publishedAt?.toISOString() ?? null },
          locale,
          tFeatures,
        ),
      }
    }
    const profile = await marketplaceContainer.getAgencyProfileUseCase.execute({
      id: address.profileId,
    })
    return {
      kind: 'agency' as const,
      handle: address.handle,
      profile: toAgencyProfile(
        { ...profile, publishedAt: profile.publishedAt?.toISOString() ?? null },
        locale,
        tFeatures,
      ),
    }
  } catch (error) {
    if (error instanceof BrokerProfileNotFoundError || error instanceof AgencyProfileNotFoundError)
      return null
    throw error
  }
})

export async function generateMetadata({ params }: LocaleRoutePageProps<{ handle: string }>) {
  const { handle, locale } = await params
  const result = await getProfile(handle, locale as AppLocale)
  if (!result) return privateMetadata
  const t = await getTranslations({ locale, namespace: 'marketplace.metadata' })
  const description =
    result.kind === 'broker'
      ? t('details.brokerDescription', {
          name: result.profile.name,
          creci: result.profile.creci ?? '',
          region: result.profile.region ?? '',
        })
      : t('details.agencyDescription', {
          name: result.profile.name,
          creci: result.profile.legalCreci ?? '',
          headquarters: result.profile.headquarters ?? '',
        })
  return {
    ...publicMetadata(locale, { pathname: '/p/[handle]', params: { handle: result.handle } }),
    title: `Ketris | ${result.profile.name}`,
    description,
  }
}

export default async function PublicAddressPage({
  params,
}: LocaleRoutePageProps<{ handle: string }>) {
  const { handle, locale } = await params
  const result = await getProfile(handle, locale as AppLocale)
  if (!result) notFound()
  return result.kind === 'broker' ? (
    <BrokerPublicProfilePage broker={result.profile} publicHandle={result.handle} />
  ) : (
    <AgencyPublicProfilePage agency={result.profile} publicHandle={result.handle} />
  )
}
