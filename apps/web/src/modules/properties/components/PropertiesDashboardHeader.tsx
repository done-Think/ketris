import { Box, Button, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { brand, componentText, iconSize, radius, surface } from '@shared/theme/tokens'

import type { PropertiesDashboardHeaderProps } from '../types/dashboard-property'

export function PropertiesDashboardHeader({
  searchQuery,
  onSearchQueryChange,
  onCreateProperty,
}: PropertiesDashboardHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'stretch', md: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 2.4 }}
    >
      <Box>
        <Typography variant="h3" sx={componentText.dashboardPageTitle}>
          Meus Imóveis
        </Typography>
        <Typography sx={{ color: 'text.secondary', ...componentText.dashboardPageSubtitle }}>
          Gerencie seu portfólio de imóveis
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.2}>
        <TextField
          placeholder="Buscar imóveis..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          slotProps={{
            htmlInput: { 'aria-label': 'Buscar imóveis' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: brand.neutral[500], fontSize: iconSize.md }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            width: { xs: '100%', sm: 360 },
            flex: { xs: 1, sm: 'initial' },
            '& .MuiOutlinedInput-root': {
              height: 48,
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              ...componentText.dashboardInput,
            },
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onCreateProperty}
          sx={{
            height: 48,
            borderRadius: `${radius.sm}px`,
            px: 2.6,
            ...componentText.dashboardInput,
            ...componentText.dashboardActionLabel,
            whiteSpace: 'nowrap',
          }}
        >
          Novo Imóvel
        </Button>
      </Stack>
    </Stack>
  )
}
