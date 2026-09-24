import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, InputAdornment, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardNotificationsButton, DashboardPageHeader } from '@shared/components/layout'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import type { LeadsHeaderProps } from '../../types/lead'

export function LeadsHeader({ search, onSearchChange, onNewLead }: LeadsHeaderProps) {
  const t = useTranslations('crm.leads')

  const actions = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.2}
      sx={{ width: { xs: '100%', md: 'auto' }, alignItems: { xs: 'stretch', sm: 'center' } }}
    >
      <TextField
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
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
        startIcon={<AddRoundedIcon sx={{ fontSize: iconSize.lg }} />}
        disabled={!onNewLead}
        onClick={onNewLead}
        sx={{
          borderRadius: `${radius.sm}px`,
          boxShadow: shadows.none,
          minHeight: 36,
          px: 2,
          fontSize: 14,
          fontWeight: 800,
          textTransform: 'none',
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
