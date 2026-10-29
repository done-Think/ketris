'use client'

import type { PropertySortField } from '../types/property'

import { styles } from '../styles/properties-dashboard-page.styles'

import { useListState } from '@shared/hooks/use-list-state'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { getRestrictedRoleAccess } from '@shared/lib/auth/restricted-role-access'
import { useDashboardPropertyMappingOptions } from '../hooks/use-dashboard-property-mapping-options'
import { usePropertyPage } from '../hooks/use-properties'
import type {
  DashboardPropertyFilterKey,
  PropertiesDashboardFiltersState,
} from '../types/dashboard-property'
import { toDashboardProperty } from '../utils/map-dashboard-property'
import { PropertiesDashboardHeader } from './PropertiesDashboardHeader'
import { PropertiesTable } from './PropertiesTable'
import { PropertyStatusFilters } from './PropertyStatusFilters'

export function PropertiesDashboardPage() {
  const t = useTranslations('properties.dashboard.renter')
  const { data: session } = useSession()
  const restrictedAccess = getRestrictedRoleAccess(session?.role)
  const isRestrictedViewer = Boolean(restrictedAccess)
  const isReadOnlyViewer = isRestrictedViewer && !restrictedAccess?.canManageProperties
  const router = useRouter()
  const mappingOptions = useDashboardPropertyMappingOptions()
  const {
    filters: { activeStatusFilter, searchQuery, page, pageSize, sortModel },
    setFilter,
  } = useListState<PropertiesDashboardFiltersState>({
    activeStatusFilter: 'all',
    searchQuery: '',
    page: 0,
    pageSize: 5,
    sortModel: [],
  })
  const statusByFilter = {
    available: 'PUBLISHED',
    rented: 'RENTED',
    sold: 'SOLD',
    inReview: 'DRAFT',
    inactive: 'INACTIVE',
  } as const
  const propertiesQuery = usePropertyPage({
    locale: mappingOptions.locale,
    page: page + 1,
    pageSize,
    search: searchQuery,
    sortBy: sortModel[0]?.field as PropertySortField | undefined,
    sortOrder: sortModel[0]?.sort ?? undefined,
    status:
      isReadOnlyViewer || activeStatusFilter === 'all'
        ? undefined
        : statusByFilter[activeStatusFilter],
  })
  const properties = (propertiesQuery.data?.properties ?? []).map((property) =>
    toDashboardProperty(property, mappingOptions),
  )
  const counts = propertiesQuery.data?.counts
  const inventoryCount = Object.values(counts ?? {}).reduce((sum, count) => sum + count, 0)
  const statusFilterCounts: Record<DashboardPropertyFilterKey, number> = {
    all: inventoryCount,
    available: counts?.PUBLISHED ?? 0,
    rented: counts?.RENTED ?? 0,
    sold: counts?.SOLD ?? 0,
    inReview: counts?.DRAFT ?? 0,
    inactive: counts?.INACTIVE ?? 0,
  }

  if (propertiesQuery.isLoading) {
    return (
      <Stack alignItems="center" sx={styles.stack}>
        <CircularProgress aria-label={t('loading')} />
      </Stack>
    )
  }
  if (propertiesQuery.isError) {
    return (
      <Typography role="alert" sx={styles.typography}>
        {t('loadError')}
      </Typography>
    )
  }

  return (
    <Box sx={styles.box}>
      <Stack spacing={2} sx={styles.stack2}>
        <PropertiesDashboardHeader
          readOnly={isReadOnlyViewer}
          searchQuery={searchQuery}
          onSearchQueryChange={(value) => {
            setFilter('searchQuery', value)
            setFilter('page', 0)
          }}
          onCreateProperty={() => router.push('/dashboard/properties/new')}
        />
        {!isReadOnlyViewer && (
          <PropertyStatusFilters
            activeStatusFilter={activeStatusFilter}
            statusFilterCounts={statusFilterCounts}
            onStatusFilterChange={(filter) => {
              setFilter('activeStatusFilter', filter)
              setFilter('page', 0)
            }}
          />
        )}
        <PropertiesTable
          readOnly={isReadOnlyViewer}
          properties={properties}
          totalCount={propertiesQuery.data?.pagination.total ?? 0}
          inventoryCount={inventoryCount}
          sortModel={sortModel}
          onSortChange={(model) => {
            setFilter('sortModel', model)
            setFilter('page', 0)
          }}
          page={page}
          pageSize={pageSize}
          onPaginationChange={(model) => {
            setFilter('page', model.page)
            setFilter('pageSize', model.pageSize)
          }}
          onCreateProperty={() => router.push('/dashboard/properties/new')}
          onPropertySelect={(propertyId) =>
            router.push({ pathname: '/dashboard/properties/[id]', params: { id: propertyId } })
          }
        />
      </Stack>
    </Box>
  )
}
