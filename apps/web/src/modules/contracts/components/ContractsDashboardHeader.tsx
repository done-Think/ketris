import { styles } from '../styles/contracts-dashboard-header.styles'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, InputAdornment, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
} from '@shared/components/layout'
import type { ContractsDashboardPageHeaderProps } from '../types/contract'

export function ContractsDashboardHeader({
  control,
  onCreateContract,
}: ContractsDashboardPageHeaderProps) {
  const t = useTranslations('contracts.dashboardHeader')

  const actions = (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={styles.stack}>
      <Controller
        control={control}
        name="searchQuery"
        render={({ field }) => (
          <TextField
            {...field}
            placeholder={t('searchPlaceholder')}
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
        )}
      />
      {onCreateContract ? (
        <DashboardHeaderActionButton
          startIcon={<AddRoundedIcon sx={styles.addRoundedIcon} />}
          onClick={onCreateContract}
        >
          {t('newContract')}
        </DashboardHeaderActionButton>
      ) : null}
      <Box sx={styles.box}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return (
    <DashboardPageHeader
      title={t('title')}
      subtitle={t('subtitle')}
      actions={actions}
      sx={styles.dashboardPageHeader}
    />
  )
}
