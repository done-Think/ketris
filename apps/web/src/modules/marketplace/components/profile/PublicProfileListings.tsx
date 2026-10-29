'use client'

import { Box, Chip, Stack, Typography } from '@mui/material'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import type { PublicProfileListingsProps } from '../../types/profile-listings'
import { getPropertyFeatureLabel } from '../../utils/property-feature-label'
import { buildProfileListingHref } from '../../utils/property-links'
import {
  styles,
  getBoxStyles,
  getBoxStyles2,
  getPlaceOutlinedIconStyles,
  getTypographyStyles,
  getBoxStyles3,
} from '../../styles/public-profile-listings.styles'

export function PublicProfileListings({
  accentColor,
  listings,
  source,
}: PublicProfileListingsProps) {
  const t = useTranslations('marketplace.publicProfile.listings')
  const tDetail = useTranslations('marketplace.propertyDetail')

  return (
    <>
      <Typography variant="h5" sx={styles.typography}>
        {t('title')}
      </Typography>
      <Box sx={styles.box}>
        {listings.map((listing) => (
          <Box
            key={listing.href}
            component={Link}
            href={buildProfileListingHref(listing.href, source)}
            aria-label={t('viewAriaLabel', { title: listing.title })}
            sx={getBoxStyles({ accentColor })}
          >
            <Box sx={getBoxStyles2({ listing })} />
            <Box sx={styles.box2}>
              <Stack direction="row" spacing={0.8} alignItems="center" sx={styles.stack}>
                <PlaceOutlinedIcon sx={getPlaceOutlinedIconStyles({ accentColor })} />
                <Typography sx={styles.typography2}>
                  {listing.location}
                  {listing.category ? ` / ${listing.category}` : ''}
                </Typography>
              </Stack>
              <Typography sx={styles.typography3}>{listing.title}</Typography>
              <Typography sx={getTypographyStyles({ accentColor })}>{listing.price}</Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={styles.stack2}>
                {listing.details.map((detail) => (
                  <Chip
                    key={detail.key}
                    label={getPropertyFeatureLabel(detail, tDetail)}
                    size="small"
                    sx={styles.chip}
                  />
                ))}
              </Stack>
              <Box component="span" sx={getBoxStyles3({ accentColor })}>
                <HomeWorkOutlinedIcon sx={styles.homeWorkOutlinedIcon} />
                {t('viewProperty')}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </>
  )
}
