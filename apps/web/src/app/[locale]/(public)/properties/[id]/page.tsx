import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { PropertyDetailPage } from '@modules/marketplace/components/PropertyDetailPage'
import { getPropertyDetailById } from '@modules/marketplace/data/property-details'
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

export async function generateMetadata({
  params,
}: LocaleRoutePageProps<{ id: string }, PropertyPageSearchParams>) {
  const { id, locale } = await params
  const t = await getTranslations({
    locale,
    namespace: 'marketplace.metadata.details',
  })
  const property = getPropertyDetailById(id)

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
  const property = getPropertyDetailById(id)

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
