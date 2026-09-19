import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, InputAdornment, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardNotificationsButton, DashboardPageHeader } from '@shared/components/layout'
import { brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import type { ContactsHeaderProps } from '../../types/contact'

export function ContactsHeader({ search, onSearchChange, onNewContact }: ContactsHeaderProps) {
  const t = useTranslations('crm.contacts')

  const actions = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ sm: 'center' }}
      justifyContent={{ sm: 'flex-end' }}
      gap={1.2}
      sx={{ width: { xs: '100%', lg: 'auto' }, minWidth: 0 }}
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
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            fontSize: 14,
            '& fieldset': { borderColor: brand.neutral[100] },
            '&:hover fieldset': { borderColor: brand.neutral[200] },
          },
          '& .MuiInputBase-input::placeholder': {
            color: brand.neutral[400],
            opacity: 1,
          },
        }}
        slotProps={{
          htmlInput: { 'aria-label': t('searchAriaLabel') },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: brand.neutral[400], fontSize: iconSize.sm }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        type="button"
        variant="contained"
        startIcon={<AddRoundedIcon />}
        disabled={!onNewContact}
        onClick={onNewContact}
        sx={{
          minHeight: 36,
          px: 2,
          flexShrink: 0,
          borderRadius: `${radius.sm}px`,
          boxShadow: shadows.none,
          fontSize: 14,
          fontWeight: 800,
          whiteSpace: 'nowrap',
          '& .MuiButton-startIcon': { ml: 0, mr: 0.75 },
          '& .MuiSvgIcon-root': { fontSize: iconSize.sm },
          '&.Mui-disabled': {
            bgcolor: brand.magenta[500],
            color: surface.lightText,
            opacity: 1,
          },
        }}
      >
        {t('newContact')}
      </Button>

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return <DashboardPageHeader title={t('title')} subtitle={t('subtitle')} actions={actions} />
}
