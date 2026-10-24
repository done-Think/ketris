import { styles, getTabStyles } from '../styles/property-detail-tabs.styles'
import { Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { dashboardPropertyTabs } from '../config/dashboard-property-ui'
import type { PropertyDetailTabsProps } from '../types/dashboard-property'

export function PropertyDetailTabs({
  activeTab,
  onTabChange,
  readOnly = false,
}: PropertyDetailTabsProps) {
  const t = useTranslations('properties.detail.tabs')

  return (
    <Stack direction="row" spacing={3} sx={styles.stack}>
      {dashboardPropertyTabs
        .filter((tab) => !readOnly || tab === 'data' || tab === 'media')
        .map((tab) => {
          const active = tab === activeTab

          return (
            <Typography
              key={tab}
              component="button"
              type="button"
              onClick={() => onTabChange(tab)}
              sx={getTabStyles(active)}
            >
              {t(tab)}
            </Typography>
          )
        })}
    </Stack>
  )
}
