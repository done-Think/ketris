import { Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { motion } from '@shared/theme/tokens'

import { dashboardPropertyTabs } from '../config/dashboard-property-ui'
import type { PropertyDetailTabsProps } from '../types/dashboard-property'

export function PropertyDetailTabs({ activeTab, onTabChange }: PropertyDetailTabsProps) {
  const t = useTranslations('properties.detail.tabs')

  return (
    <Stack
      direction="row"
      spacing={3}
      sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      {dashboardPropertyTabs.map((tab) => {
        const active = tab === activeTab

        return (
          <Typography
            key={tab}
            component="button"
            type="button"
            onClick={() => onTabChange(tab)}
            sx={{
              border: 0,
              pb: 1.2,
              borderBottom: '2px solid',
              borderColor: active ? 'primary.main' : 'transparent',
              color: active ? 'primary.main' : 'text.secondary',
              bgcolor: 'transparent',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 16,
              fontWeight: active ? 900 : 700,
              transition: motion.transition.bordered,
              '&:hover': { color: 'primary.main' },
            }}
          >
            {t(tab)}
          </Typography>
        )
      })}
    </Stack>
  )
}
