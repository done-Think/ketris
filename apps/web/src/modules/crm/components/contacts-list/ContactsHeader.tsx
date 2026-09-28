import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, InputAdornment, MenuItem, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import {
  DashboardNotificationsButton,
  DashboardPageHeader,
  dashboardHeaderActionButtonSx,
} from '@shared/components/layout'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

import { contactFilters } from '../../config/contact-filters'
import type { ContactsHeaderProps } from '../../types/contact'

export function ContactsHeader({
  search,
  activeFilter,
  onSearchChange,
  onFilterChange,
  onNewContact,
}: ContactsHeaderProps) {
  const t = useTranslations('crm.contacts')

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
          width: { xs: '100%', sm: 268 },
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

      <TextField
        select
        size="small"
        value={activeFilter}
        onChange={(event) => onFilterChange(event.target.value as typeof activeFilter)}
        sx={{
          width: { xs: '100%', sm: 190 },
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
        SelectProps={{
          inputProps: { 'aria-label': t('filterAriaLabel') },
        }}
      >
        {contactFilters.map(({ label, labelKey }) => {
          return (
            <MenuItem key={label} value={label}>
              {t(`filters.${labelKey}`)}
            </MenuItem>
          )
        })}
      </TextField>

      <Button
        type="button"
        variant="contained"
        startIcon={<AddRoundedIcon sx={{ fontSize: iconSize.sm }} />}
        disabled={!onNewContact}
        onClick={onNewContact}
        sx={{
          ...dashboardHeaderActionButtonSx,
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

  return (
    <DashboardPageHeader
      title={t('title')}
      subtitle={t('subtitle')}
      actions={actions}
      sx={{ mb: 2.2 }}
    />
  )
}
