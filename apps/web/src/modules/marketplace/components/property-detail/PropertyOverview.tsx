'use client'

import { Box, Button, Stack, Typography } from '@mui/material'
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined'
import BedOutlinedIcon from '@mui/icons-material/BedOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import LocalParkingOutlinedIcon from '@mui/icons-material/LocalParkingOutlined'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined'
import { useTranslations } from 'next-intl'

import { isPropertyTypeCode, propertyTypeLabelKeys } from '../../config/property-types'
import type { PropertyOverviewProps } from '../../types/property-detail'
import { getPropertyFeatureLabel } from '../../utils/property-feature-label'
import { PropertyDetailMap } from '../PropertyDetailMap'
import { styles } from '../../styles/property-overview.styles'

const featureIcons = [
  BedOutlinedIcon,
  BathtubOutlinedIcon,
  LocalParkingOutlinedIcon,
  SquareFootOutlinedIcon,
]

export function PropertyOverview({ property }: PropertyOverviewProps) {
  const t = useTranslations('marketplace.propertyDetail')
  const categoryKey = isPropertyTypeCode(property.category)
    ? propertyTypeLabelKeys[property.category]
    : undefined

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} sx={styles.stack}>
        <Typography sx={styles.typography}>{property.location}</Typography>
        <Typography sx={styles.typography2}>
          / {categoryKey ? t(`categories.${categoryKey}`) : property.category}
        </Typography>
      </Stack>

      <Typography variant="h3" component="h1" sx={styles.typography3}>
        {property.title}
      </Typography>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={styles.stack2}>
        <Button startIcon={<FavoriteBorderOutlinedIcon />} variant="outlined" color="secondary">
          {t('favorite')}
        </Button>
        <Button startIcon={<ShareOutlinedIcon />} variant="outlined" color="secondary">
          {t('share')}
        </Button>
      </Stack>

      <Box sx={styles.box}>
        {property.details.map((detail, index) => {
          const Icon = featureIcons[index] ?? SquareFootOutlinedIcon

          return (
            <Box key={detail.key} sx={styles.box2}>
              <Icon sx={styles.icon} />
              <Typography sx={styles.typography4}>{getPropertyFeatureLabel(detail, t)}</Typography>
            </Box>
          )
        })}
      </Box>

      <Typography variant="h5" sx={styles.typography5}>
        {t('about')}
      </Typography>
      <Typography sx={styles.typography6}>{property.description}</Typography>

      <Typography variant="h5" sx={styles.typography5}>
        {t('location')}
      </Typography>
      <Typography sx={styles.typography7}>{property.address}</Typography>
      <PropertyDetailMap
        latitude={property.mapCenter.latitude}
        longitude={property.mapCenter.longitude}
      />
    </>
  )
}
