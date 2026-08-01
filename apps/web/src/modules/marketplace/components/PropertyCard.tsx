'use client'

import { useState } from 'react'
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined'
import BedOutlinedIcon from '@mui/icons-material/BedOutlined'
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import LocalParkingOutlinedIcon from '@mui/icons-material/LocalParkingOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined'

import type { MarketplaceProperty } from '../types/property'

type PropertyCardProps = {
  property: MarketplaceProperty
  selected?: boolean
  onSelect: (property: MarketplaceProperty) => void
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(price)

export function PropertyCard({ property, selected = false, onSelect }: PropertyCardProps) {
  const [favorite, setFavorite] = useState(false)

  const details: Array<{ icon: typeof BedOutlinedIcon; label: string }> = []

  if (property.bedrooms > 0) {
    details.push({
      icon: BedOutlinedIcon,
      label: `${property.bedrooms} quarto${property.bedrooms > 1 ? 's' : ''}`,
    })
  }
  if (property.bathrooms > 0) {
    details.push({
      icon: BathtubOutlinedIcon,
      label: `${property.bathrooms} banheiro${property.bathrooms > 1 ? 's' : ''}`,
    })
  }
  if (property.parkingSpaces > 0) {
    details.push({
      icon: LocalParkingOutlinedIcon,
      label: `${property.parkingSpaces} vaga${property.parkingSpaces > 1 ? 's' : ''}`,
    })
  }
  details.push({ icon: SquareFootOutlinedIcon, label: `${property.area} m²` })

  return (
    <Card
      component="article"
      onClick={() => onSelect(property)}
      sx={{
        height: '100%',
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        boxShadow: selected
          ? '0 18px 44px rgba(243, 2, 116, 0.16)'
          : '0 12px 34px rgba(33, 38, 49, 0.07)',
        cursor: 'pointer',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': {
          borderColor: 'rgba(243, 2, 116, 0.32)',
          boxShadow: '0 20px 48px rgba(33, 38, 49, 0.13)',
          transform: 'translateY(-3px)',
        },
      }}
    >
      <Box sx={{ position: 'relative', height: { xs: 210, sm: 190 } }}>
        <Box
          component="img"
          src={property.image}
          alt={property.title}
          loading="lazy"
          sx={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
        />
        <Stack direction="row" spacing={0.75} sx={{ position: 'absolute', top: 12, left: 12 }}>
          {property.isNew && (
            <Chip
              label="Novo"
              size="small"
              sx={{ bgcolor: '#FFFFFF', fontWeight: 800, fontSize: 11 }}
            />
          )}
          {property.isFeatured && (
            <Chip
              label="Destaque"
              size="small"
              sx={{ bgcolor: '#212631', color: '#FFFFFF', fontWeight: 800, fontSize: 11 }}
            />
          )}
        </Stack>
        <IconButton
          aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          onClick={(event) => {
            event.stopPropagation()
            setFavorite((current) => !current)
          }}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 38,
            height: 38,
            bgcolor: '#FFFFFF',
            color: favorite ? 'primary.main' : 'text.primary',
            boxShadow: '0 6px 20px rgba(33,38,49,0.14)',
            '&:hover': { bgcolor: '#FFFFFF', color: 'primary.main' },
          }}
        >
          {favorite ? (
            <FavoriteRoundedIcon fontSize="small" />
          ) : (
            <FavoriteBorderRoundedIcon fontSize="small" />
          )}
        </IconButton>
      </Box>

      <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
        <Stack direction="row" alignItems="center" spacing={0.45} sx={{ mb: 0.75 }}>
          <LocationOnOutlinedIcon sx={{ fontSize: 15, color: 'primary.main' }} />
          <Typography color="text.secondary" sx={{ fontSize: 11.5, fontWeight: 800 }}>
            {property.location}
          </Typography>
        </Stack>

        <Typography
          component="h2"
          sx={{
            minHeight: 46,
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 17,
            fontWeight: 800,
            lineHeight: 1.3,
          }}
        >
          {property.title}
        </Typography>

        <Typography sx={{ color: 'primary.main', fontSize: 20, fontWeight: 900, mt: 0.8 }}>
          {formatPrice(property.price)}
          <Box component="span" sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 600 }}>
            {' '}
            / mês
          </Box>
        </Typography>

        <Stack direction="row" spacing={1.35} useFlexGap flexWrap="wrap" sx={{ my: 1.6 }}>
          {details.map(({ icon: Icon, label }) => (
            <Stack key={label} direction="row" alignItems="center" spacing={0.45}>
              <Icon sx={{ color: 'text.secondary', fontSize: 16 }} />
              <Typography color="text.secondary" sx={{ fontSize: 11.5 }}>
                {label}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <Divider sx={{ mb: 1.5 }} />

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={0.9}>
            <Avatar src={property.avatar} alt={property.broker} sx={{ width: 29, height: 29 }} />
            <Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 800, lineHeight: 1.2 }}>
                {property.broker}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 10.5 }}>
                Corretor parceiro
              </Typography>
            </Box>
          </Stack>
          <Typography sx={{ color: 'primary.main', fontSize: 11.5, fontWeight: 900 }}>
            Ver no mapa
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
