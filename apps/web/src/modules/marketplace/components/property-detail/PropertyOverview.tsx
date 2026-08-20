'use client'

import { Box, Button, Stack, Typography } from '@mui/material'
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined'
import BedOutlinedIcon from '@mui/icons-material/BedOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import LocalParkingOutlinedIcon from '@mui/icons-material/LocalParkingOutlined'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined'

import { componentText, iconSize, radius, surface } from '@shared/theme/tokens'

import type { PropertyOverviewProps } from '../../types/property-detail'
import { PropertyDetailMap } from '../PropertyDetailMap'

const featureIcons = [
  BedOutlinedIcon,
  BathtubOutlinedIcon,
  LocalParkingOutlinedIcon,
  SquareFootOutlinedIcon,
]

export function PropertyOverview({ property }: PropertyOverviewProps) {
  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography sx={{ color: 'primary.main', ...componentText.cardEyebrow }}>
          {property.location}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>
          / {property.category}
        </Typography>
      </Stack>

      <Typography variant="h3" sx={{ maxWidth: 760, mb: 2 }}>
        {property.title}
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{
          display: { xs: 'flex', lg: 'none' },
          mb: 3,
        }}
      >
        <Button startIcon={<FavoriteBorderOutlinedIcon />} variant="outlined" color="secondary">
          Favoritar
        </Button>
        <Button startIcon={<ShareOutlinedIcon />} variant="outlined" color="secondary">
          Compartilhar
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: 1,
          mb: 4,
        }}
      >
        {property.details.map((detail, index) => {
          const Icon = featureIcons[index] ?? SquareFootOutlinedIcon

          return (
            <Box
              key={detail.key}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
                px: 2,
                py: 1.8,
              }}
            >
              <Icon sx={{ color: 'primary.main', fontSize: iconSize.lg, mb: 0.6 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{detail.label}</Typography>
            </Box>
          )
        })}
      </Box>

      <Typography variant="h5" sx={{ mb: 1.2 }}>
        Sobre o imóvel
      </Typography>
      <Typography sx={{ color: 'text.secondary', maxWidth: 820, mb: 4 }}>
        {property.description}
      </Typography>

      <Typography variant="h5" sx={{ mb: 1.2 }}>
        Localização
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 1.4, fontWeight: 700 }}>
        {property.address}
      </Typography>
      <PropertyDetailMap
        latitude={property.mapCenter.latitude}
        longitude={property.mapCenter.longitude}
      />
    </>
  )
}
