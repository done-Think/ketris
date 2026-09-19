import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, InputAdornment, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardNotificationsButton, DashboardPageHeader } from '@shared/components/layout'
import { brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import type { LeadsHeaderProps } from '../../types/lead'

export function LeadsHeader({ search, onSearchChange, onNewLead }: LeadsHeaderProps) {
  const t = useTranslations('crm.leads')

  const actions = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.2}
      sx={{ width: { xs: '100%', lg: 'auto' }, alignItems: { sm: 'center' } }}
    >
      <TextField
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t('searchPlaceholder')}
        size="small"
        sx={{
          width: { xs: '100%', sm: 280 },
          '& .MuiOutlinedInput-root': {
            height: 36,
            bgcolor: surface.paper,
            borderRadius: `${radius.sm}px`,
            fontSize: 14,
            '& fieldset': { borderColor: brand.neutral[100] },
            '&:hover fieldset': { borderColor: brand.neutral[200] },
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
          minHeight: 36,
          px: 2,
          borderRadius: `${radius.sm}px`,
          boxShadow: shadows.none,
          fontSize: 14,
          fontWeight: 800,
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

  return <DashboardPageHeader title={t('title')} subtitle={t('subtitle')} actions={actions} />
}
