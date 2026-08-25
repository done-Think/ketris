import { notFound } from 'next/navigation'

import { PropertyDetailPage } from '@modules/marketplace/components/PropertyDetailPage'
import { getPropertyDetailById } from '@modules/marketplace/data/property-details'
import type {
  PropertyBreadcrumbOriginType,
  PropertyBreadcrumbPurpose,
  PropertyPageProps,
} from '@modules/marketplace/types/property-detail'

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
  if (!href?.startsWith('/')) return undefined
  if (href.startsWith('//')) return undefined

  if (originType === 'broker' && !href.startsWith('/corretores/')) return undefined
  if (originType === 'agency' && !href.startsWith('/imobiliarias/')) return undefined

  return href
}

function getValidOriginType(originType: string | undefined) {
  if (originType === 'broker' || originType === 'agency') return originType

  return undefined
}

function getValidPurpose(purpose: string | undefined): PropertyBreadcrumbPurpose | undefined {
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
