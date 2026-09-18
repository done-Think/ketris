import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { brand, iconSize, radius, surface } from '@shared/theme/tokens'

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

  return (
    <Stack
      component="header"
      direction={{ xs: 'column', lg: 'row' }}
      alignItems={{ xs: 'stretch', lg: 'center' }}
      justifyContent="space-between"
      gap={1.5}
      sx={{
        pb: 1.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        component="h1"
        sx={{
          flexShrink: 0,
          fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
          fontSize: { xs: 26, sm: 30 },
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}
      >
        {t('title')}
      </Typography>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent={{ sm: 'flex-end' }}
        gap={1.25}
        sx={{ minWidth: 0, flexWrap: { sm: 'wrap', lg: 'nowrap' } }}
      >
        <TextField
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('searchPlaceholder')}
          size="small"
          sx={{
            width: { xs: '100%', sm: 268 },
            '& .MuiOutlinedInput-root': {
              height: 32,
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              fontSize: 11.5,
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

        <TextField
          select
          size="small"
          value={activeFilter}
          onChange={(event) => onFilterChange(event.target.value as typeof activeFilter)}
          sx={{
            width: { xs: '100%', sm: 190 },
            '& .MuiOutlinedInput-root': {
              minHeight: 32,
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              color: brand.graphite[500],
              fontSize: 11.5,
              fontWeight: 700,
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent',
                borderWidth: 0,
              },
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent',
              borderWidth: 0,
            },
            '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent',
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

        <Box sx={{ display: 'inline-flex' }}>
          <Button
            type="button"
            variant="contained"
            startIcon={<AddRoundedIcon />}
            disabled={!onNewContact}
            onClick={onNewContact}
            sx={{
              width: { sm: 126 },
              minWidth: { sm: 126 },
              height: 32,
              px: 1.5,
              flexShrink: 0,
              borderRadius: `${radius.sm}px`,
              fontSize: 11.5,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              '& .MuiButton-startIcon': { ml: 0, mr: 0.625 },
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
        </Box>
      </Stack>
    </Stack>
  )
}
