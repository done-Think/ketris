'use client'

import { notFound } from 'next/navigation'
import { Box, Stack } from '@mui/material'
import { useForm } from 'react-hook-form'

import { getDashboardPropertyById } from '../data/dashboard-properties'
import type {
  PropertyDetailDashboardFormValues,
  PropertyDetailDashboardPageProps,
} from '../types/dashboard-property'
import { PropertyDetailHeader } from './PropertyDetailHeader'
import { PropertyDetailMainPanel } from './PropertyDetailMainPanel'
import { PropertyDetailSidebar } from './PropertyDetailSidebar'
import { PropertyDetailTabs } from './PropertyDetailTabs'

export function PropertyDetailDashboardPage({ propertyId }: PropertyDetailDashboardPageProps) {
  const { setValue, watch } = useForm<PropertyDetailDashboardFormValues>({
    defaultValues: {
      activeTab: 'Dados',
    },
  })
  const activeTab = watch('activeTab')
  const property = getDashboardPropertyById(propertyId)

  if (!property) notFound()

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
