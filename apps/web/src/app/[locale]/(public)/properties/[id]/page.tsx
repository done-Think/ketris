import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { marketplaceContainer } from '@server/marketplace/container'
import { PropertyNotFoundError } from '@server/marketplace/domain/errors'
import { PropertyDetailPage } from '@modules/marketplace/components/PropertyDetailPage'
import type {
  PropertyBreadcrumbOriginType,
  PropertyBreadcrumbPurpose,
  PropertyPageSearchParams,
} from '@modules/marketplace/types/property-detail'
import {
  buildPublicProfileHref,
  getInternalMarketplaceHref,
  isSafeMarketplaceOriginHref,
} from '@modules/marketplace/utils/property-links'
import { mapDetailToMarketplacePropertyDetail } from '@modules/marketplace/utils/property-detail-adapter'

const getProperty = cache(async (id: string) => {
  try {
    const property = await marketplaceContainer.getPropertyUseCase.execute({ propertyId: id })
    return mapDetailToMarketplacePropertyDetail({
      ...property,
      publishedAt: property.publishedAt?.toISOString() ?? null,
    })
  } catch (error) {
    if (error instanceof PropertyNotFoundError) return null

    throw error
  }
})

export async function generateMetadata({
  params,
}: LocaleRoutePageProps<{ id: string }, PropertyPageSearchParams>) {
  const { id, locale } = await params
  const t = await getTranslations({
    locale,
    namespace: 'marketplace.metadata.details',
  })
  const property = await getProperty(id)

  if (!property) return { title: t('notFoundTitle') }

  return {
    title: `Ketris | ${property.title}`,
    description: property.description,
  }
}

function getSafeOriginHref(
  href: string | undefined,
  originType: PropertyBreadcrumbOriginType | undefined,
) {
  if (!href) return undefined
  if (!isSafeMarketplaceOriginHref(href, originType)) return undefined
  if (!originType) return undefined

  return buildPublicProfileHref(getInternalMarketplaceHref(href), originType)
}

function getValidOriginType(originType: string | undefined) {
  if (originType === 'broker' || originType === 'agency') return originType

  return undefined
}

function getValidPurpose(purpose: string | undefined): PropertyBreadcrumbPurpose | undefined {
  if (purpose === 'rent') return 'alugar'
  if (purpose === 'buy') return 'comprar'
  if (purpose === 'alugar' || purpose === 'comprar') return purpose

  return undefined
}

export default async function PropertyPage({
  params,
  searchParams,
}: LocaleRoutePageProps<{ id: string }, PropertyPageSearchParams>) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const property = await getProperty(id)

  if (!property) notFound()

  const activePurpose = getValidPurpose(resolvedSearchParams?.purpose)
  const originType = getValidOriginType(resolvedSearchParams?.source)
  const originHref = getSafeOriginHref(resolvedSearchParams?.sourceHref, originType)
  const originName = originHref ? resolvedSearchParams?.sourceName : undefined

  return (
    <PropertyDetailPage
      activePurpose={activePurpose}
      property={property}
      breadcrumbContext={{
        originHref,
        originName,
        originType,
        purpose: activePurpose,
      }}
    />
  )
}
