'use client'

import { Box, Stack, Typography } from '@mui/material'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { PillBadge } from '@shared/components/ui'
import { iconSize, motion, radius, shadows, surface } from '@shared/theme/tokens'

import type { ProfileListingPreviewSectionProps } from '../../types/profile-listings'
import { buildProfileListingHref } from '../../utils/property-links'

export function ProfileListingPreviewSection({
  accentColor,
  backgroundColor,
  hoverBorderColor,
  listings,
  sideBorderBreakpoint = 'md',
}: ProfileListingPreviewSectionProps) {
  const t = useTranslations('marketplace.publicProfile.listings')
  const sideBorderStyles =
    sideBorderBreakpoint === 'lg'
      ? {
          borderLeft: { lg: '1px solid' },
          borderTop: { xs: '1px solid', lg: 0 },
          pl: { lg: 2.4 },
          pt: { xs: 2, lg: 0 },
        }
      : {
          borderLeft: { md: '1px solid' },
          borderTop: { xs: '1px solid', md: 0 },
          pl: { md: 2.4 },
          pt: { xs: 2, md: 0 },
        }

  return (
    <Box
      sx={{
        minWidth: 0,
        borderColor: 'divider',
        ...sideBorderStyles,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mb: 1.2 }}>
        <HomeWorkOutlinedIcon sx={{ color: accentColor, fontSize: iconSize.sm }} />
        <Typography sx={{ fontSize: 12, fontWeight: 900 }}>{t('featuredTitle')}</Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 1,
        }}
      >
        {listings.map((listing) => (
          <Box
            component={Link}
            href={buildProfileListingHref(listing.href)}
            key={listing.href}
            sx={{
              display: 'block',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: `${radius.sm}px`,
              bgcolor: backgroundColor,
              color: 'inherit',
              overflow: 'hidden',
              textDecoration: 'none',
              transition: motion.transition.bordered,
              '&:hover': {
                borderColor: hoverBorderColor,
                boxShadow: shadows.propertyCard,
              },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                height: 118,
                bgcolor: surface.paper,
                backgroundImage: listing.image ? `url("${listing.image}")` : undefined,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
              }}
            >
              <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                <PillBadge>{t('featured')}</PillBadge>
              </Box>
            </Box>
            <Box sx={{ minWidth: 0, px: 1, py: 0.75 }}>
              <Typography noWrap sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 900 }}>
                {listing.location}
              </Typography>
              <Stack direction="row" alignItems="end" justifyContent="space-between" spacing={1}>
                <Typography noWrap sx={{ color: accentColor, fontSize: 14, fontWeight: 900 }}>
                  {listing.price}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, max-content)',
                    columnGap: 0.55,
                    rowGap: 0.2,
                    flex: '0 0 auto',
                  }}
                >
                  {listing.details.slice(0, 4).map((detail) => (
                    <Typography
                      key={detail.key}
                      noWrap
                      sx={{ color: 'text.secondary', fontSize: 9.5, fontWeight: 700 }}
                    >
                      {detail.label}
                    </Typography>
                  ))}
                </Box>
              </Stack>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
