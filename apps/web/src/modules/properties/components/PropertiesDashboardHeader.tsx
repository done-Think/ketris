import { styles } from '../styles/properties-dashboard-header.styles'
import { Box, InputAdornment, Stack, TextField } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { useTranslations } from 'next-intl'

import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
} from '@shared/components/layout'

import type { PropertiesDashboardHeaderProps } from '../types/dashboard-property'

export function PropertiesDashboardHeader({
  readOnly = false,
  searchQuery,
  onSearchQueryChange,
  onCreateProperty,
}: PropertiesDashboardHeaderProps) {
  const t = useTranslations('properties.dashboard')

  const actions = (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={styles.stack}>
      <Box sx={styles.box}>
        <TextField
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchAriaLabel')}
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          size="small"
          sx={styles.textField}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={styles.searchRoundedIcon} />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      {!readOnly && (
        <DashboardHeaderActionButton
          startIcon={<AddRoundedIcon sx={styles.addRoundedIcon} />}
          onClick={onCreateProperty}
        >
          {t('create')}
        </DashboardHeaderActionButton>
      )}
      <Box sx={styles.box2}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return (
    <DashboardPageHeader
      title={t('title')}
      subtitle={t(readOnly ? 'renter.subtitle' : 'subtitle')}
      actions={actions}
      sx={styles.dashboardPageHeader}
    />
  )
}
