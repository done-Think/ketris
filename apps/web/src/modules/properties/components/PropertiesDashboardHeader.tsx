import { Box, Button, Stack, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { useTranslations } from 'next-intl'

import { DashboardNotificationsButton } from '@shared/components/layout'
import { brand, iconSize, radius, surface } from '@shared/theme/tokens'

import type { PropertiesDashboardHeaderProps } from '../types/dashboard-property'

export function PropertiesDashboardHeader({
  searchQuery,
  onSearchQueryChange,
  onCreateProperty,
}: PropertiesDashboardHeaderProps) {
  const t = useTranslations('properties.dashboard')

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'stretch', md: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 2.4 }}
    >
      <Box>
        <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 900 }}>
          {t('title')}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: { xs: 15, md: 17 } }}>
          {t('subtitle')}
        </Typography>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.2}
        sx={{ width: { xs: '100%', md: 'auto' } }}
      >
        <Box
          sx={{
            position: 'relative',
            width: { xs: '100%', sm: 360 },
            flex: { xs: 1, sm: 'initial' },
          }}
        >
          <SearchRoundedIcon
            sx={{
              position: 'absolute',
              left: 11,
              top: '50%',
              transform: 'translateY(-50%)',
              color: brand.neutral[500],
              fontSize: iconSize.md,
              pointerEvents: 'none',
            }}
          />
          <Box
            component="input"
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchAriaLabel')}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            sx={{
              width: '100%',
              height: 48,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              color: 'text.primary',
              pl: 4,
              pr: 1.2,
              font: 'inherit',
              fontSize: 16,
              outline: 0,
              '&::placeholder': { color: brand.neutral[400] },
              '&:focus': { borderColor: 'primary.main' },
            }}
          />
        </Box>
        <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={onCreateProperty}
            sx={{
              flex: { xs: 1, sm: 'initial' },
              height: 48,
              borderRadius: `${radius.sm}px`,
              px: 2.6,
              fontSize: 16,
              fontWeight: 900,
              whiteSpace: 'nowrap',
            }}
          >
            {t('create')}
          </Button>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <DashboardNotificationsButton />
          </Box>
        </Stack>
      </Stack>
    </Stack>
  )
}
