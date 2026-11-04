'use client'

import { Avatar, Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined'
import BedOutlinedIcon from '@mui/icons-material/BedOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LocalParkingOutlinedIcon from '@mui/icons-material/LocalParkingOutlined'
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { PillBadge } from '@shared/components/ui'
import { componentText } from '@shared/theme/tokens'
import type { PropertyFeatureKey } from '@shared/types'
import type { SearchPropertyCardProps } from '../types/search'
import { getPropertyFeatureLabel } from '../utils/property-feature-label'
import { buildPropertyDetailHref } from '../utils/property-links'
import {
  styles,
  getCardStyles,
  getBoxStyles,
  getCardContentStyles,
} from '../styles/search-property-card.styles'

const detailIcons: Record<PropertyFeatureKey, typeof ApartmentOutlinedIcon> = {
  bedrooms: BedOutlinedIcon,
  bathrooms: BathtubOutlinedIcon,
  parking: LocalParkingOutlinedIcon,
  area: SquareFootOutlinedIcon,
}

export function SearchPropertyCard({
  property,
  selected = false,
  onActivate,
  viewMode = 'grid',
}: SearchPropertyCardProps) {
  const t = useTranslations('marketplace.publicProfile')
  const tDetail = useTranslations('marketplace.propertyDetail')
  const isListView = viewMode === 'list'
  const detailsHref = buildPropertyDetailHref(property.href, property.purpose)

  return (
    <Card
      component={Link}
      href={detailsHref}
      data-property-id={property.id}
      data-highlighted={selected}
      onFocus={onActivate}
      onMouseEnter={onActivate}
      sx={getCardStyles({ isListView, selected })}
    >
      <Box sx={getBoxStyles({ isListView, property })}>
        <Box sx={styles.box}>
          <PillBadge>{t('listings.featured')}</PillBadge>
        </Box>
      </Box>

      <CardContent sx={getCardContentStyles({ isListView })}>
        <Typography sx={styles.typography}>{property.location}</Typography>
        <Typography sx={styles.typography2}>{property.title}</Typography>
        <Typography color="primary" sx={styles.typography3}>
          {property.price}
        </Typography>

        <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap sx={styles.stack}>
          {property.details.map((detail) => {
            const Icon = detailIcons[detail.key] ?? ApartmentOutlinedIcon
            return (
              <Stack
                key={`${property.title}-${detail.key}`}
                direction="row"
                alignItems="center"
                spacing={0.4}
              >
                <Icon sx={styles.icon} />
                <Typography color="text.secondary" sx={componentText.cardMeta}>
                  {getPropertyFeatureLabel(detail, tDetail)}
                </Typography>
              </Stack>
            )
          })}
        </Stack>

        <Divider sx={styles.divider} />

        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1} sx={styles.stack2}>
            <Avatar src={property.avatar} alt={property.broker} sx={styles.avatar} />
            <Typography noWrap sx={componentText.cardBroker}>
              {property.broker}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.2}>
            <Typography sx={styles.typography4}>{t('propertyCard.viewDetails')}</Typography>
            <ChevronRightIcon sx={styles.chevronRightIcon} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
