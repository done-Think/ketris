import { notFound } from 'next/navigation'

import { PropertyDetailPage } from '@modules/marketplace/components/PropertyDetailPage'
import { getPropertyDetailById } from '@modules/marketplace/data/property-details'
import type { PropertyPageProps } from '@modules/marketplace/types/property-detail'
import type { SearchResultPurpose } from '@modules/marketplace/types/search'

function parsePurpose(value?: string): SearchResultPurpose | undefined {
  if (value === 'alugar' || value === 'comprar') return value

  return undefined
}

export function generateMetadata({ params }: PropertyPageProps) {
  const property = getPropertyDetailById(params.id)

  if (!property) return { title: 'Ketris' }

  return {
    title: `${property.title} | Ketris`,
    description: property.description,
  }
}

export default function PropertyPage({ params, searchParams }: PropertyPageProps) {
  const property = getPropertyDetailById(params.id)

  if (!property) notFound()

  return (
    <PropertyDetailPage
      property={property}
      activePurpose={parsePurpose(searchParams?.finalidade)}
    />
  )
}
