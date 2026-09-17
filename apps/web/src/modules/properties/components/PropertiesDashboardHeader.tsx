import { Box, Button, Stack, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { useTranslations } from 'next-intl'

import { DashboardNotificationsButton } from '@shared/components/layout'
import { brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

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
        <Typography variant="h3" sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 800 }}>
          {t('title')}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700 }}>
          {t('subtitle')}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.2}>
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
              fontSize: iconSize.sm,
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
              height: 36,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              color: 'text.primary',
              pl: 4,
              pr: 1.2,
              font: 'inherit',
              fontSize: 14,
              fontWeight: 700,
              outline: 0,
              '&::placeholder': { color: brand.neutral[400] },
              '&:focus': { borderColor: 'primary.main' },
            }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon sx={{ fontSize: iconSize.lg }} />}
          onClick={onCreateProperty}
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
          {t('create')}
        </Button>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <DashboardNotificationsButton />
        </Box>
      </Stack>
    </Stack>
  )
}
