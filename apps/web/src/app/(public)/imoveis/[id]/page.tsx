import { notFound } from 'next/navigation'

import { PropertyDetailPage } from '@modules/marketplace/components/PropertyDetailPage'
import { getPropertyDetailById } from '@modules/marketplace/data/property-details'
import type {
  PropertyBreadcrumbOriginType,
  PropertyBreadcrumbPurpose,
  PropertyPageProps,
} from '@modules/marketplace/types/property-detail'
import {
  buildPublicProfileHref,
  getInternalMarketplaceHref,
  isSafeMarketplaceOriginHref,
} from '@modules/marketplace/utils/property-links'

export function generateMetadata({ params }: PropertyPageProps) {
  const property = getPropertyDetailById(params.id)

  if (!property) return { title: 'Ketris' }

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

export default function PropertyPage({ params, searchParams }: PropertyPageProps) {
  const property = getPropertyDetailById(params.id)

  if (!property) notFound()

  const activePurpose = getValidPurpose(searchParams?.purpose)
  const originType = getValidOriginType(searchParams?.source)
  const originHref = getSafeOriginHref(searchParams?.sourceHref, originType)
  const originName = originHref ? searchParams?.sourceName : undefined

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
