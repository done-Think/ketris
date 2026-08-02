import { Avatar, Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined'
import BedOutlinedIcon from '@mui/icons-material/BedOutlined'
import LocalParkingOutlinedIcon from '@mui/icons-material/LocalParkingOutlined'
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined'
import Link from 'next/link'

import { radius, shadows, surface } from '@shared/theme/tokens'

export type PropertyFeatureKey = 'bedrooms' | 'bathrooms' | 'parking' | 'area'

export type PropertyCardData = {
  href: string
  image: string
  location: string
  title: string
  price: string
  details: Array<{
    key: PropertyFeatureKey
    label: string
  }>
  broker: string
  avatar: string
}

const detailIcons: Record<PropertyFeatureKey, typeof ApartmentOutlinedIcon> = {
  bedrooms: BedOutlinedIcon,
  bathrooms: BathtubOutlinedIcon,
  parking: LocalParkingOutlinedIcon,
  area: SquareFootOutlinedIcon,
}

type PropertyCardProps = {
  property: PropertyCardData
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Card
      component={Link}
      href={property.href}
      sx={{
        overflow: 'hidden',
        borderRadius: `${radius.sm}px`,
        color: 'inherit',
        textDecoration: 'none',
        boxShadow: shadows.propertyCard,
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': {
          boxShadow: shadows.propertyCardHover,
          transform: 'translateY(-4px)',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: 175,
          backgroundImage: `url("${property.image}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 14,
            left: 14,
            bgcolor: surface.paper,
            borderRadius: radius.full,
            px: 1.2,
            py: 0.4,
            color: 'text.primary',
            fontSize: 11.5,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          Novo
        </Box>
      </Box>
      <CardContent sx={{ p: 2.4 }}>
        <Typography
          sx={{
            color: 'text.secondary',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 0,
            textTransform: 'uppercase',
            mb: 0.6,
          }}
        >
          {property.location}
        </Typography>
        <Typography sx={{ fontSize: 17, fontWeight: 900, lineHeight: 1.25, mb: 1 }}>
          {property.title}
        </Typography>
        <Typography color="primary" sx={{ fontSize: 20, fontWeight: 900, mb: 1.5 }}>
          {property.price}
        </Typography>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {property.details.map((detail) => {
            const Icon = detailIcons[detail.key] ?? ApartmentOutlinedIcon
            return (
              <Stack key={detail.key} direction="row" alignItems="center" spacing={0.4}>
                <Icon sx={{ color: 'text.secondary', fontSize: 15 }} />
                <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                  {detail.label}
                </Typography>
              </Stack>
            )
          })}
        </Stack>
        <Divider sx={{ mb: 1.6 }} />
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar src={property.avatar} alt={property.broker} sx={{ width: 30, height: 30 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{property.broker}</Typography>
          </Stack>
          <Typography
            sx={{
              color: 'primary.main',
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1.35,
              textRendering: 'geometricPrecision',
            }}
          >
            Ver detalhes
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
