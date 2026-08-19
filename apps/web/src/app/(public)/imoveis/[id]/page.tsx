import { notFound } from 'next/navigation'

import { PropertyDetailPage } from '@modules/marketplace/components/PropertyDetailPage'
import { getPropertyDetailById } from '@modules/marketplace/data/property-details'

type PropertyPageProps = {
  params: {
    id: string
  }
  searchParams?: {
    finalidade?: string
    origem?: string
    origemHref?: string
    origemNome?: string
  }
}

export function generateMetadata({ params }: PropertyPageProps) {
  const property = getPropertyDetailById(params.id)

  if (!property) return { title: 'Ketris' }

  return {
    title: `${property.title} | Ketris`,
    description: property.description,
  }
}

function getSafeOriginHref(href: string | undefined) {
  if (!href?.startsWith('/')) return undefined
  if (href.startsWith('//')) return undefined

  return href
}

export default function PropertyPage({ params, searchParams }: PropertyPageProps) {
  const property = getPropertyDetailById(params.id)

  if (!property) notFound()

  return (
    <PropertyDetailPage
      property={property}
      breadcrumbContext={{
        originHref: getSafeOriginHref(searchParams?.origemHref),
        originName: searchParams?.origemNome,
        originType: searchParams?.origem,
        purpose: searchParams?.finalidade,
      }}
    />
  )
}
