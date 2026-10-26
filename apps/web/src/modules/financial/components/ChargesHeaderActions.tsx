import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, InputAdornment, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
} from '@shared/components/layout'

import { styles } from '../styles/charges-header-actions.styles'
import type { ChargesHeaderActionsProps } from '../types/charge'

export function ChargesHeaderActions({
  search,
  canCreate,
  onSearchChange,
  onCreate,
}: ChargesHeaderActionsProps) {
  const t = useTranslations('charges')

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={styles.actions}>
      <TextField
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t('searchPlaceholder')}
        size="small"
        slotProps={{
          htmlInput: { 'aria-label': t('searchPlaceholder') },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={styles.search}
      />
      {canCreate ? (
        <DashboardHeaderActionButton startIcon={<AddRoundedIcon />} onClick={onCreate}>
          {t('newCharge')}
        </DashboardHeaderActionButton>
      ) : null}
      <Box sx={styles.desktopOnly}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )
}
