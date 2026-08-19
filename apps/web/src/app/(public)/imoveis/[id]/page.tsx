import { notFound } from 'next/navigation'

import { PropertyDetailPage } from '@modules/marketplace/components/PropertyDetailPage'
import { getPropertyDetailById } from '@modules/marketplace/data/property-details'

type PropertyPageProps = {
  params: {
    id: string
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

export default function PropertyPage({ params }: PropertyPageProps) {
  const property = getPropertyDetailById(params.id)

  if (!property) notFound()

  return <PropertyDetailPage property={property} />
}
