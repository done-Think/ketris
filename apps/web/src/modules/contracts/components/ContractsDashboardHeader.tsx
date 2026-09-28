import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, InputAdornment, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'

import {
  DashboardNotificationsButton,
  DashboardPageHeader,
  dashboardHeaderActionButtonSx,
} from '@shared/components/layout'
import { alpha, brand, radius, surface } from '@shared/theme/tokens'

import type { ContractsDashboardPageHeaderProps } from '../types/contract'

export function ContractsDashboardHeader({
  control,
  onCreateContract,
}: ContractsDashboardPageHeaderProps) {
  const t = useTranslations('contracts.dashboardHeader')

  const actions = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.2}
      sx={{ width: { xs: '100%', md: 'auto' }, alignItems: { xs: 'stretch', sm: 'center' } }}
    >
      <Controller
        control={control}
        name="searchQuery"
        render={({ field }) => (
          <TextField
            {...field}
            placeholder={t('searchPlaceholder')}
            size="small"
            sx={{
              width: { xs: '100%', sm: 280 },
              '& .MuiInputBase-root': {
                height: { xs: 40, sm: 32 },
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
                color: brand.graphite[500],
                fontSize: 12,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha.graphite[8],
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: brand.neutral[400], fontSize: 16 }} />
                </InputAdornment>
              ),
            }}
          />
        )}
      />
      <Button
        variant="contained"
        startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
        onClick={onCreateContract}
        sx={dashboardHeaderActionButtonSx}
      >
        {t('newContract')}
      </Button>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return (
    <DashboardPageHeader
      title={t('title')}
      subtitle={t('subtitle')}
      actions={actions}
      sx={{ mb: 2.2 }}
    />
  )
}
