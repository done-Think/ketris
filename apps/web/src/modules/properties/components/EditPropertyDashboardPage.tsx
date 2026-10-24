'use client'

import { notFound } from 'next/navigation'

import { useProperty } from '../hooks/use-properties'
import type { EditPropertyDashboardPageProps } from '../types/dashboard-property'
import { isPropertyNotFound } from '../utils/is-property-not-found'
import { EditPropertyForm } from './EditPropertyForm'
import { PropertyQueryFeedback } from './PropertyQueryFeedback'

export function EditPropertyDashboardPage({ propertyId }: EditPropertyDashboardPageProps) {
  const query = useProperty(propertyId)
  if (!query.data) {
    if (query.isError) {
      if (isPropertyNotFound(query.error)) notFound()
      return (
        <PropertyQueryFeedback
          onRetry={() => {
            void query.refetch()
          }}
        />
      )
    }
    return <PropertyQueryFeedback loading />
  }
  return (
    <>
      {query.isError ? (
        <PropertyQueryFeedback
          onRetry={() => {
            void query.refetch()
          }}
        />
      ) : null}
      <EditPropertyForm key={propertyId} property={query.data} />
    </>
  )
}
