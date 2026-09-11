import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { ContractsDashboardPageHeaderProps } from '../types/contract'

export function ContractsDashboardHeader({
  control,
  onCreateContract,
}: ContractsDashboardPageHeaderProps) {
  const t = useTranslations('contracts.dashboardHeader')

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', md: 'center' }}
      spacing={2}
      sx={{ mb: 1.6 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h3"
          sx={{ color: brand.graphite[500], fontSize: { xs: 20, md: 24 }, fontWeight: 800 }}
        >
          {t('title')}
        </Typography>
      </Box>

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
                  height: 36,
                  borderRadius: `${radius.sm}px`,
                  bgcolor: surface.paper,
                  color: brand.graphite[500],
                  fontSize: 14,
                  fontWeight: 700,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha.graphite[8],
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: brand.neutral[400], fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={onCreateContract}
          sx={{
            borderRadius: `${radius.sm}px`,
            boxShadow: shadows.none,
            minHeight: 36,
            px: 2,
            fontSize: 14,
            fontWeight: 800,
            textTransform: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {t('newContract')}
        </Button>
      </Stack>
    </Stack>
  )
}
