import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'

import { componentText, radius, surface } from '@shared/theme/tokens'

import { dashboardPropertyStatusStyles } from '../config/dashboard-property-ui'
import type { PropertyDetailHeaderProps } from '../types/dashboard-property'

export function PropertyDetailHeader({ property }: PropertyDetailHeaderProps) {
  const status = dashboardPropertyStatusStyles[property.status]

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-start', md: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 2.6 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1.6} sx={{ mb: 0.7 }}>
          <Typography variant="h2" sx={{ ...componentText.dashboardHeroTitle }}>
            {property.title}
          </Typography>
          <Chip
            label={property.status}
            sx={{
              height: 32,
              borderRadius: `${radius.full}px`,
              bgcolor: status.bgcolor,
              color: status.color,
              ...componentText.dashboardBadge,
            }}
          />
        </Stack>
        <Typography sx={{ color: 'text.secondary', ...componentText.dashboardPageSubtitle }}>
          {property.address} - {property.location}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.2}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<EditOutlinedIcon />}
          sx={{
            height: 46,
            px: 2.2,
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            ...componentText.dashboardItemLabel,
          }}
        >
          Editar
        </Button>
        <Button
          variant="contained"
          startIcon={<VisibilityOffOutlinedIcon />}
          sx={{
            height: 46,
            px: 2.4,
            borderRadius: `${radius.sm}px`,
            ...componentText.dashboardItemLabel,
          }}
        >
          Despublicar
        </Button>
      </Stack>
    </Stack>
  )
}
