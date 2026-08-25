'use client'

import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import Link from 'next/link'

import { alpha, componentText, iconSize, radius, shadows, surface } from '@shared/theme/tokens'
import type { PublicProfileListingsProps } from '../../types/profile-listings'

function buildListingHref(href: string, source: PublicProfileListingsProps['source']) {
  if (!source) return href

  const params = new URLSearchParams({
    source: source.type,
    sourceHref: source.href,
    sourceName: source.name,
  })

  return `${href}?${params.toString()}`
}

export function PublicProfileListings({
  accentColor,
  listings,
  source,
}: PublicProfileListingsProps) {
  return (
    <>
      <Typography variant="h5" sx={{ mb: 1.5 }}>
        Imóveis representados
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: { xs: 2, xl: 2.5 },
        }}
      >
        {listings.map((listing) => (
          <Box
            key={listing.href}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              boxShadow: shadows.propertyCard,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                height: 190,
                bgcolor: surface.app,
                backgroundImage: listing.image ? `url("${listing.image}")` : undefined,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
              }}
            />
            <Box sx={{ p: 2 }}>
              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.6 }}>
                <PlaceOutlinedIcon sx={{ color: accentColor, fontSize: iconSize.xs }} />
                <Typography sx={{ color: 'text.secondary', ...componentText.cardEyebrow }}>
                  {listing.location}
                  {listing.category ? ` / ${listing.category}` : ''}
                </Typography>
              </Stack>
              <Typography sx={{ ...componentText.cardTitle, mt: 0.6, mb: 0.8 }}>
                {listing.title}
              </Typography>
              <Typography sx={{ color: accentColor, ...componentText.cardPrice, mb: 1.3 }}>
                {listing.price}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1.6 }}>
                {listing.details.map((detail) => (
                  <Chip
                    key={detail.key}
                    label={detail.label}
                    size="small"
                    sx={{
                      height: 26,
                      borderRadius: `${radius.sm}px`,
                      bgcolor: alpha.graphite[6],
                      fontSize: 11,
                    }}
                  />
                ))}
              </Stack>
              <Button
                component={Link}
                href={buildListingHref(listing.href, source)}
                variant="contained"
                fullWidth
                startIcon={<HomeWorkOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
                sx={{
                  bgcolor: accentColor,
                  '&:hover': {
                    bgcolor: accentColor,
                    filter: 'brightness(0.92)',
                  },
                }}
              >
                Ver imóvel
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
    </>
  )
}
