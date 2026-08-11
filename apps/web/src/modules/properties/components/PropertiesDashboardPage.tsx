'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box } from '@mui/material'

import { dashboardProperties, propertyStatusFilters } from '../data/dashboard-properties'
import type { DashboardProperty, DashboardPropertyFilterKey } from '../types/dashboard-property'
import { PropertiesDashboardHeader } from './PropertiesDashboardHeader'
import { PropertiesTable } from './PropertiesTable'
import { PropertyStatusFilters } from './PropertyStatusFilters'

function matchesStatusFilter(property: DashboardProperty, filter: DashboardPropertyFilterKey) {
  if (filter === 'Todos') return true
  if (filter === 'Vendido') return property.purpose === 'Venda' && property.status === 'Ativo'

  return property.status === filter
}

function matchesSearchQuery(property: DashboardProperty, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
  if (!normalizedQuery) return true

  return [property.title, property.address, property.location, property.type, property.broker].some(
    (value) => value.toLocaleLowerCase('pt-BR').includes(normalizedQuery),
  )
}

export function PropertiesDashboardPage() {
  const router = useRouter()
  const [activeStatusFilter, setActiveStatusFilter] = useState<DashboardPropertyFilterKey>('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const filteredProperties = useMemo(
    () =>
      dashboardProperties.filter(
        (property) =>
          matchesStatusFilter(property, activeStatusFilter) &&
          matchesSearchQuery(property, searchQuery),
      ),
    [activeStatusFilter, searchQuery],
  )
  const statusFilterCounts = useMemo(
    () =>
      propertyStatusFilters.reduce(
        (counts, filter) => ({
          ...counts,
          [filter.label]: dashboardProperties.filter((property) =>
            matchesStatusFilter(property, filter.label),
          ).length,
        }),
        {} as Record<DashboardPropertyFilterKey, number>,
      ),
    [],
  )

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Box
        sx={{
          width: '100%',
          minHeight: { md: 'calc(100vh - 68px)' },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <PropertiesDashboardHeader
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onCreateProperty={() => router.push('/dashboard/imoveis/novo')}
        />
        <PropertyStatusFilters
          activeStatusFilter={activeStatusFilter}
          statusFilterCounts={statusFilterCounts}
          onStatusFilterChange={setActiveStatusFilter}
        />
        <PropertiesTable
          properties={filteredProperties}
          totalCount={dashboardProperties.length}
          onPropertySelect={(propertyId) => router.push(`/dashboard/imoveis/${propertyId}`)}
        />
      </Box>
    </Box>
  )
}
