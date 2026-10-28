'use client'

import { styles } from '@shared/styles/property-card.styles'

import { Avatar, Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined'
import BedOutlinedIcon from '@mui/icons-material/BedOutlined'
import LocalParkingOutlinedIcon from '@mui/icons-material/LocalParkingOutlined'
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { componentText } from '@shared/theme/tokens'
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

export function PropertyCard({ property }: PropertyCardProps) {
  const t = useTranslations('marketplace.publicProfile.propertyCard')

  return (
    <Card component={Link} href={getPropertyCardHref(property.href)} sx={styles.card}>
      <Box sx={styles.box(property.image)}>
        <Box sx={styles.box2}>
          <PillBadge>{t('new')}</PillBadge>
        </Box>
      </Box>
      <CardContent sx={styles.cardContent}>
        <Typography sx={styles.typography}>{property.location}</Typography>
        <Typography sx={styles.typography2}>{property.title}</Typography>
        <Typography color="primary" sx={styles.typography3}>
          {property.price}
        </Typography>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={styles.stack}>
          {property.details.map((detail) => {
            const Icon = detailIcons[detail.key] ?? ApartmentOutlinedIcon
            return (
              <Stack key={detail.key} direction="row" alignItems="center" spacing={0.4}>
                <Icon sx={styles.icon} />
                <Typography color="text.secondary" sx={componentText.cardMeta}>
                  {detail.label}
                </Typography>
              </Stack>
            )
          })}
        </Stack>
        <Divider sx={styles.divider} />
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar src={property.avatar} alt={property.broker} sx={styles.avatar} />
            <Typography sx={componentText.cardBroker}>{property.broker}</Typography>
          </Stack>
          <Typography sx={styles.typography4}>{t('viewDetails')}</Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
