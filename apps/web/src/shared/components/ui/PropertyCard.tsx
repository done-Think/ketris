'use client'

import { Avatar, Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined'
import BedOutlinedIcon from '@mui/icons-material/BedOutlined'
import LocalParkingOutlinedIcon from '@mui/icons-material/LocalParkingOutlined'
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { componentText, iconSize, motion, radius, shadows } from '@shared/theme/tokens'
import type { PropertyCardProps, PropertyFeatureKey } from '@shared/types'
import type { LocalizedHref } from '@shared/types/localized-href'
import { PillBadge } from './PillBadge'

const detailIcons: Record<PropertyFeatureKey, typeof ApartmentOutlinedIcon> = {
  bedrooms: BedOutlinedIcon,
  bathrooms: BathtubOutlinedIcon,
  parking: LocalParkingOutlinedIcon,
  area: SquareFootOutlinedIcon,
}

function getPropertyCardHref(href: string): LocalizedHref {
  const id = href.split('?')[0].split('/').filter(Boolean).at(-1)

  if (href === '/properties') return '/properties'
  if (id && href.startsWith('/properties/')) {
    return {
      pathname: '/properties/[id]',
      params: { id },
    }
  }

  return href as LocalizedHref
}

export function PropertyCard({ href, property }: PropertyCardProps) {
  const t = useTranslations('marketplace.publicProfile.propertyCard')

  return (
    <Card
      component={Link}
      href={href ?? getPropertyCardHref(property.href)}
      sx={{
        overflow: 'hidden',
        borderRadius: `${radius.sm}px`,
        color: 'inherit',
        textDecoration: 'none',
        boxShadow: shadows.propertyCard,
        transition: motion.transition.card,
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
            top: 12,
            left: 12,
          }}
        >
          <PillBadge>{t('new')}</PillBadge>
        </Box>
      </Box>
      <CardContent sx={{ p: 2.4 }}>
        <Typography
          sx={{
            color: 'text.secondary',
            ...componentText.cardEyebrow,
            mb: 0.6,
          }}
        >
          {property.location}
        </Typography>
        <Typography sx={{ ...componentText.cardTitle, mb: 1 }}>{property.title}</Typography>
        <Typography color="primary" sx={{ ...componentText.cardPrice, mb: 1.5 }}>
          {property.price}
        </Typography>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {property.details.map((detail) => {
            const Icon = detailIcons[detail.key] ?? ApartmentOutlinedIcon
            return (
              <Stack key={detail.key} direction="row" alignItems="center" spacing={0.4}>
                <Icon sx={{ color: 'text.secondary', fontSize: iconSize.xs }} />
                <Typography color="text.secondary" sx={componentText.cardMeta}>
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
            <Typography sx={componentText.cardBroker}>{property.broker}</Typography>
          </Stack>
          <Typography
            sx={{
              color: 'primary.main',
              ...componentText.cardAction,
            }}
          >
            {t('viewDetails')}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
