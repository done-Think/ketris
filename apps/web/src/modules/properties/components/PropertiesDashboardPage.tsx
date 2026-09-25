'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Box, Stack } from '@mui/material'

import { useRouter } from '@/i18n/navigation'
import { dashboardProperties, propertyStatusFilters } from '../data/dashboard-properties'
import { useProperties } from '../hooks/use-properties'
import type {
  DashboardProperty,
  DashboardPropertyFilterKey,
  PropertiesDashboardFiltersFormValues,
} from '../types/dashboard-property'
import { toDashboardProperty } from '../utils/map-dashboard-property'
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
  const propertiesQuery = useProperties()
  const canUseFixtures = process.env.NODE_ENV !== 'production'
  const fixtureMode =
    canUseFixtures &&
    !propertiesQuery.isLoading &&
    (propertiesQuery.isError || (propertiesQuery.data ?? []).length === 0)
  const properties = useMemo(
    () =>
      fixtureMode ? dashboardProperties : (propertiesQuery.data ?? []).map(toDashboardProperty),
    [fixtureMode, propertiesQuery.data],
  )
  const { setValue, watch } = useForm<PropertiesDashboardFiltersFormValues>({
    defaultValues: {
      activeStatusFilter: 'Todos',
      searchQuery: '',
    },
  })
  const { activeStatusFilter, searchQuery } = watch()
  const filteredProperties = useMemo(
    () =>
      properties.filter(
        (property) =>
          matchesStatusFilter(property, activeStatusFilter) &&
          matchesSearchQuery(property, searchQuery),
      ),
    [properties, activeStatusFilter, searchQuery],
  )
  const statusFilterCounts = useMemo(
    () =>
      propertyStatusFilters.reduce(
        (counts, filter) => ({
          ...counts,
          [filter.label]: properties.filter((property) =>
            matchesStatusFilter(property, filter.label),
          ).length,
        }),
        {} as Record<DashboardPropertyFilterKey, number>,
      ),
    [properties],
  )

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack
        spacing={2}
        sx={{
          width: '100%',
          minHeight: { md: 'calc(100vh - 68px)' },
        }}
      >
        <PropertiesDashboardHeader
          searchQuery={searchQuery}
          onSearchQueryChange={(value) => setValue('searchQuery', value)}
          onCreateProperty={() => router.push('/dashboard/properties/new')}
        />
        <PropertyStatusFilters
          activeStatusFilter={activeStatusFilter}
          statusFilterCounts={statusFilterCounts}
          onStatusFilterChange={(filter) => setValue('activeStatusFilter', filter)}
        />
        <PropertiesTable
          properties={filteredProperties}
          totalCount={properties.length}
          onPropertySelect={(propertyId) =>
            router.push({ pathname: '/dashboard/properties/[id]', params: { id: propertyId } })
          }
        />
      </Stack>
    </Box>
  )
}
