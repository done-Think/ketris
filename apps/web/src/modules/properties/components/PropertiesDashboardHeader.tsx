import { Box, Button, InputAdornment, Stack, TextField } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { useTranslations } from 'next-intl'

import { DashboardNotificationsButton, DashboardPageHeader } from '@shared/components/layout'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import type { PropertiesDashboardHeaderProps } from '../types/dashboard-property'

export function PropertiesDashboardHeader({
  searchQuery,
  onSearchQueryChange,
  onCreateProperty,
}: PropertiesDashboardHeaderProps) {
  const t = useTranslations('properties.dashboard')

  const actions = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.2}
      sx={{ width: { xs: '100%', md: 'auto' }, alignItems: { xs: 'stretch', sm: 'center' } }}
    >
      <Box
        sx={{
          width: { xs: '100%', sm: 280 },
          flex: { xs: 1, sm: 'initial' },
        }}
      >
        <TextField
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchAriaLabel')}
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          size="small"
          sx={{
            width: '100%',
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
                <SearchRoundedIcon sx={{ color: brand.neutral[400], fontSize: iconSize.sm }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Button
        variant="contained"
        startIcon={<AddRoundedIcon sx={{ fontSize: iconSize.sm }} />}
        onClick={onCreateProperty}
        sx={{
          borderRadius: `${radius.sm}px`,
          boxShadow: shadows.none,
          height: { xs: 40, sm: 32 },
          px: 1.5,
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {t('create')}
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
