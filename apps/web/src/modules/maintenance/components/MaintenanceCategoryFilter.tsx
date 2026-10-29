'use client'

import { MenuItem, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import {
  isMaintenanceCategory,
  maintenanceCategories,
  maintenanceCategoryKeys,
} from '@shared/lib/utils/maintenance-categories'

import { categoryFilterSx, compactFieldSx } from '../styles/maintenance-dashboard-page.styles'
import type { MaintenanceCategoryFilterProps } from '../types/maintenance-dashboard'

export function MaintenanceCategoryFilter({
  value,
  onChange,
  compact = false,
}: MaintenanceCategoryFilterProps) {
  const t = useTranslations('dashboard.maintenance')
  return (
    <TextField
      select
      label={t('filterDialog.category')}
      value={value}
      onChange={(event) =>
        onChange(isMaintenanceCategory(event.target.value) ? event.target.value : 'all')
      }
      size="small"
      fullWidth={!compact}
      sx={compact ? categoryFilterSx : compactFieldSx}
    >
      <MenuItem value="all">{t('allCategories')}</MenuItem>
      {maintenanceCategories.map((category) => (
        <MenuItem key={category} value={category}>
          {t(`categories.${maintenanceCategoryKeys[category]}`)}
        </MenuItem>
      ))}
    </TextField>
  )
}
