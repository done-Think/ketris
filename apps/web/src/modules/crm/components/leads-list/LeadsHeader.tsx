import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardNotificationsButton } from '@shared/components/layout'
import { brand, iconSize, radius, surface } from '@shared/theme/tokens'

import type { LeadsHeaderProps } from '../../types/lead'

export function LeadsHeader({ search, onSearchChange, onNewLead }: LeadsHeaderProps) {
  const t = useTranslations('crm.leads')

  return (
    <Stack
      component="header"
      direction={{ xs: 'column', lg: 'row' }}
      alignItems={{ xs: 'stretch', lg: 'flex-start' }}
      justifyContent="space-between"
      spacing={1.6}
      sx={{ pb: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="h1"
          sx={{
            fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
            fontSize: { xs: 26, sm: 30 },
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}
        >
          {t('title')}
        </Typography>
        <Typography sx={{ color: brand.neutral[500], fontSize: { xs: 13, sm: 14 } }}>
          {t('subtitle')}
        </Typography>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.2}
        sx={{ width: { xs: '100%', lg: 'auto' } }}
      >
        <TextField
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('searchPlaceholder')}
          size="small"
          sx={{
            width: { xs: '100%', sm: 280 },
            '& .MuiOutlinedInput-root': {
              bgcolor: surface.paper,
              borderRadius: `${radius.sm}px`,
            },
          }}
          slotProps={{
            htmlInput: { 'aria-label': t('searchAriaLabel') },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: brand.neutral[400], fontSize: iconSize.md }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          type="button"
          variant="contained"
          startIcon={<AddRoundedIcon sx={{ fontSize: iconSize.sm }} />}
          disabled={!onNewLead}
          onClick={onNewLead}
          sx={{
            minHeight: 40,
            borderRadius: `${radius.sm}px`,
            fontWeight: 900,
            whiteSpace: 'nowrap',
            '&.Mui-disabled': {
              bgcolor: brand.magenta[500],
              color: surface.lightText,
              opacity: 1,
            },
          }}
        >
          {t('newLead')}
        </Button>
        <DashboardNotificationsButton />
      </Stack>
    </Stack>
  )
}
