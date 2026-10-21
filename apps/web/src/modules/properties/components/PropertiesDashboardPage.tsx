'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import {
  dashboardProperties,
  localizeDashboardPropertyFixture,
  propertyStatusFilters,
} from '../data/dashboard-properties'
import { useDashboardPropertyMappingOptions } from '../hooks/use-dashboard-property-mapping-options'
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
  if (filter === 'Vendido') return property.apiStatus === 'SOLD'

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
  const t = useTranslations('properties.dashboard.renter')
  const { data: session } = useSession()
  const isRenter = session?.papel === 'RENTER'
  const router = useRouter()
  const propertiesQuery = useProperties()
  const mappingOptions = useDashboardPropertyMappingOptions()
  const canUseFixtures = !isRenter && process.env.NODE_ENV !== 'production'
  const fixtureMode = canUseFixtures && !propertiesQuery.isLoading && propertiesQuery.isError
  const properties = useMemo(
    () =>
      fixtureMode
        ? dashboardProperties.map((property) =>
            localizeDashboardPropertyFixture(property, mappingOptions),
          )
        : (propertiesQuery.data ?? []).map((property) =>
            toDashboardProperty(property, mappingOptions),
          ),
    [fixtureMode, mappingOptions, propertiesQuery.data],
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
          (isRenter || matchesStatusFilter(property, activeStatusFilter)) &&
          matchesSearchQuery(property, searchQuery),
      ),
    [properties, activeStatusFilter, isRenter, searchQuery],
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

  if (isRenter && propertiesQuery.isLoading) {
    return (
      <Stack alignItems="center" sx={{ p: 4 }}>
        <CircularProgress aria-label={t('loading')} />
      </Stack>
    )
  }
  if (isRenter && propertiesQuery.isError) {
    return (
      <Typography role="alert" sx={{ p: 4 }}>
        {t('loadError')}
      </Typography>
    )
  }

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
          readOnly={isRenter}
          searchQuery={searchQuery}
          onSearchQueryChange={(value) => setValue('searchQuery', value)}
          onCreateProperty={() => router.push('/dashboard/properties/new')}
        />
        {!isRenter && (
          <PropertyStatusFilters
            activeStatusFilter={activeStatusFilter}
            statusFilterCounts={statusFilterCounts}
            onStatusFilterChange={(filter) => setValue('activeStatusFilter', filter)}
          />
        )}
        <PropertiesTable
          readOnly={isRenter}
          properties={filteredProperties}
          totalCount={properties.length}
          onCreateProperty={() => router.push('/dashboard/properties/new')}
          onPropertySelect={(propertyId) =>
            router.push({ pathname: '/dashboard/properties/[id]', params: { id: propertyId } })
          }
        />
      </Stack>
    </Box>
  )
}
