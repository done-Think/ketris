import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, InputAdornment, Stack, TextField, Typography } from '@mui/material'

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
        Contatos
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
          placeholder="Buscar contato por nome, email, fone..."
          inputProps={{ 'aria-label': 'Buscar contatos' }}
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
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: brand.neutral[400], fontSize: iconSize.sm }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Stack
          component="div"
          role="group"
          aria-label="Filtrar contatos por tipo"
          direction="row"
          spacing={0.75}
          sx={{ overflowX: { xs: 'auto', sm: 'visible' }, pb: { xs: 0.25, sm: 0 } }}
        >
          {contactFilters.map(({ label }) => {
            const active = label === activeFilter

            return (
              <Button
                key={label}
                type="button"
                variant={active ? 'contained' : 'outlined'}
                aria-pressed={active}
                onClick={() => onFilterChange(label)}
                sx={{
                  minWidth: 0,
                  height: 28,
                  px: 1.4,
                  flexShrink: 0,
                  borderColor: active ? brand.magenta[500] : brand.neutral[100],
                  borderRadius: `${radius.full}px`,
                  bgcolor: active ? brand.magenta[500] : surface.paper,
                  color: active ? surface.lightText : brand.graphite[500],
                  fontSize: 10.5,
                  fontWeight: active ? 700 : 500,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: active ? brand.magenta[600] : brand.neutral[200],
                    bgcolor: active ? brand.magenta[600] : surface.paper,
                  },
                }}
              >
                {label}
              </Button>
            )
          })}
        </Stack>

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
            Novo Contato
          </Button>
        </Box>
      </Stack>
    </Stack>
  )
}
