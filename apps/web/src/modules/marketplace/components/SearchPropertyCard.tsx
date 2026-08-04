import { Avatar, Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined'
import BedOutlinedIcon from '@mui/icons-material/BedOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LocalParkingOutlinedIcon from '@mui/icons-material/LocalParkingOutlined'
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined'
import Link from 'next/link'

import { PillBadge } from '@shared/components/ui'
import { componentText, iconSize, motion, radius, shadows } from '@shared/theme/tokens'
import type { PropertyCardData, PropertyFeatureKey } from '@shared/types'

const detailIcons: Record<PropertyFeatureKey, typeof ApartmentOutlinedIcon> = {
  bedrooms: BedOutlinedIcon,
  bathrooms: BathtubOutlinedIcon,
  parking: LocalParkingOutlinedIcon,
  area: SquareFootOutlinedIcon,
}

type SearchPropertyCardProps = {
  property: PropertyCardData
}

export function SearchPropertyCard({ property }: SearchPropertyCardProps) {
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
        transition: motion.transition.card,
        '&:hover': {
          boxShadow: shadows.propertyCardHover,
          transform: 'translateY(-3px)',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: { xs: 180, md: 150, xl: 175 },
          backgroundImage: `url("${property.image}")`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
          <PillBadge>DESTAQUE</PillBadge>
        </Box>
      </Box>

      <CardContent sx={{ p: { xs: 2, xl: 2.25 } }}>
        <Typography sx={{ color: 'text.secondary', ...componentText.cardEyebrow, mb: 0.55 }}>
          {property.location}
        </Typography>
        <Typography sx={{ ...componentText.cardTitle, mb: 0.7 }}>{property.title}</Typography>
        <Typography color="primary" sx={{ ...componentText.cardPrice, mb: 1.25 }}>
          {property.price}
        </Typography>

        <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap sx={{ mb: 1.6 }}>
          {property.details.map((detail) => {
            const Icon = detailIcons[detail.key] ?? ApartmentOutlinedIcon
            return (
              <Stack
                key={`${property.title}-${detail.key}`}
                direction="row"
                alignItems="center"
                spacing={0.4}
              >
                <Icon sx={{ color: 'text.secondary', fontSize: iconSize.xs }} />
                <Typography color="text.secondary" sx={componentText.cardMeta}>
                  {detail.label}
                </Typography>
              </Stack>
            )
          })}
        </Stack>

        <Divider sx={{ mb: 1.4 }} />

        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
            <Avatar src={property.avatar} alt={property.broker} sx={{ width: 28, height: 28 }} />
            <Typography noWrap sx={componentText.cardBroker}>
              {property.broker}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.2}>
            <Typography sx={{ color: 'primary.main', ...componentText.cardAction }}>
              Ver detalhes
            </Typography>
            <ChevronRightIcon sx={{ color: 'primary.main', fontSize: iconSize.sm }} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
