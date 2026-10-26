'use client'

import { MenuItem, TextField } from '@mui/material'
import { maintenanceCategoryKeys } from '@server/maintenance/constants/maintenance-categories'
import { useTranslations } from 'next-intl'
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
      onChange={(event) => onChange(event.target.value)}
      size="small"
      fullWidth={!compact}
      sx={compact ? categoryFilterSx : compactFieldSx}
    >
      <MenuItem value="all">{t('allCategories')}</MenuItem>
      {Object.entries(maintenanceCategoryKeys).map(([code, key]) => (
        <MenuItem key={code} value={code}>
          {t(`categories.${key}`)}
        </MenuItem>
      ))}
      {value !== 'all' && !Object.hasOwn(maintenanceCategoryKeys, value) && (
        <MenuItem value={value}>{value}</MenuItem>
      )}
    </TextField>
  )
}
