'use client'

import { notFound } from 'next/navigation'
import { Box, CircularProgress, Stack } from '@mui/material'
import { useForm } from 'react-hook-form'

import { useProperty } from '../hooks/use-properties'
import type {
  PropertyDetailDashboardFormValues,
  PropertyDetailDashboardPageProps,
} from '../types/dashboard-property'
import { toDashboardProperty } from '../utils/map-dashboard-property'
import { PropertyDetailHeader } from './PropertyDetailHeader'
import { PropertyDetailMainPanel } from './PropertyDetailMainPanel'
import { PropertyDetailSidebar } from './PropertyDetailSidebar'
import { PropertyDetailTabs } from './PropertyDetailTabs'

export function PropertyDetailDashboardPage({ propertyId }: PropertyDetailDashboardPageProps) {
  const { setValue, watch } = useForm<PropertyDetailDashboardFormValues>({
    defaultValues: {
      activeTab: 'data',
    },
  })
  const activeTab = watch('activeTab')
  const propertyQuery = useProperty(propertyId)

  if (propertyQuery.isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '55vh' }}>
        <CircularProgress size={30} />
      </Stack>
    )
  }

  if (propertyQuery.isError || !propertyQuery.data) {
    notFound()
  }

  const property = toDashboardProperty(propertyQuery.data)

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 4.8 }, py: { xs: 2.6, md: 5 } }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={{ xs: 3, lg: 3.6 }}
        alignItems="flex-start"
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <PropertyDetailHeader property={property} />
          <PropertyDetailTabs
            activeTab={activeTab}
            onTabChange={(tab) => setValue('activeTab', tab)}
          />
          <PropertyDetailMainPanel property={property} activeTab={activeTab} />
        </Box>

        <PropertyDetailSidebar property={property} />
      </Stack>
    </Box>
  )
}
