'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import { Box, Stack } from '@mui/material'

import { getDashboardPropertyById } from '../data/dashboard-properties'
import type {
  DashboardPropertyDetailTab,
  PropertyDetailDashboardPageProps,
} from '../types/dashboard-property'
import { PropertyDetailHeader } from './PropertyDetailHeader'
import { PropertyDetailMainPanel } from './PropertyDetailMainPanel'
import { PropertyDetailSidebar } from './PropertyDetailSidebar'
import { PropertyDetailTabs } from './PropertyDetailTabs'

export function PropertyDetailDashboardPage({ propertyId }: PropertyDetailDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<DashboardPropertyDetailTab>('Dados')
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
          <PropertyDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <PropertyDetailMainPanel property={property} activeTab={activeTab} />
        </Box>

        <PropertyDetailSidebar property={property} />
      </Stack>
    </Box>
  )
}
