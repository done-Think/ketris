'use client'

import { Avatar, Box, Typography } from '@mui/material'

import { useElementOverflow } from '@shared/hooks'
import { alpha, componentText, gradients, radius } from '@shared/theme/tokens'

import type {
  AgencyAdaptiveBrandHeaderProps,
  AgencyAdaptiveBrandHeaderVariant,
} from '../types/agency'

const brandHeaderConfig = {
  compact: {
    height: 74,
    columns: '64px minmax(0, 1fr)',
    padding: 1.1,
    paddingLeft: `calc(var(--agency-logo-overflow) + 8.8px)`,
    titleFontSize: 20,
    titleLineHeight: 1,
    creciFontSize: 8.5,
    fallbackFontSize: 16,
    noWrapTitle: true,
  },
  list: {
    height: { xs: 136, md: 158 },
    columns: {
      xs: '96px minmax(0, 1fr)',
      md: '120px minmax(0, 1fr)',
    },
    padding: { xs: 1.4, md: 2 },
    paddingLeft: {
      xs: `calc(var(--agency-logo-overflow) + 11.2px)`,
      md: `calc(var(--agency-logo-overflow) + 16px)`,
    },
    titleFontSize: { xs: 34, md: 48 },
    titleLineHeight: 0.98,
    creciFontSize: 11,
    fallbackFontSize: 22,
    noWrapTitle: false,
  },
  hero: {
    height: { xs: 150, md: 190 },
    columns: {
      xs: '96px minmax(0, 1fr)',
      md: '132px minmax(0, 1fr)',
    },
    padding: { xs: 1.4, md: 2 },
    paddingLeft: {
      xs: `calc(var(--agency-logo-overflow) + 11.2px)`,
      md: `calc(var(--agency-logo-overflow) + 16px)`,
    },
    titleFontSize: { xs: 34, md: 54 },
    titleLineHeight: 0.98,
    creciFontSize: { xs: 10, md: 12 },
    fallbackFontSize: 22,
    noWrapTitle: false,
  },
} satisfies Record<AgencyAdaptiveBrandHeaderVariant, Record<string, unknown>>

export function AgencyAdaptiveBrandHeader({
  agency,
  variant,
  showBanner = false,
  showHeadquarters = false,
}: AgencyAdaptiveBrandHeaderProps) {
  const config = brandHeaderConfig[variant]
  const logoUrl = agency.brand.logoUrl
  // A wide logo spills past its slot; the title column moves right by the same amount.
  const {
    containerRef: logoSlotRef,
    contentRef: logoImageRef,
    overflow: logoOverflow,
    measure: measureLogoOverflow,
  } = useElementOverflow<HTMLDivElement, HTMLImageElement>([logoUrl, variant])

  return (
    <Box
      aria-label={agency.legalCreci ? `${agency.name}, ${agency.legalCreci}` : agency.name}
      sx={{
        '--agency-logo-overflow': `${logoOverflow}px`,
        width: '100%',
        minWidth: 0,
        height: config.height,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${radius.sm}px`,
        bgcolor: 'background.paper',
        overflow: 'visible',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: config.columns,
      }}
    >
      <Box
        ref={logoSlotRef}
        sx={{
          display: 'grid',
          placeItems: 'center',
          minWidth: 0,
          position: 'relative',
          zIndex: 3,
          overflow: 'visible',
          bgcolor: agency.brand.backgroundColor ?? 'background.paper',
        }}
      >
        {logoUrl ? (
          <Box
            component="img"
            ref={logoImageRef}
            src={logoUrl}
            alt={agency.name}
            onLoad={measureLogoOverflow}
            sx={{
              position: 'absolute',
              top: '50%',
              left: 0,
              zIndex: 3,
              width: 'auto',
              height: '100%',
              maxWidth: 'none',
              objectFit: 'contain',
              transform: 'translateY(-50%)',
            }}
          />
        ) : (
          <Avatar
            variant="rounded"
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: 0,
              bgcolor: agency.brand.backgroundColor ?? 'background.paper',
              color: agency.brand.primaryColor,
              boxShadow: 'none',
              fontSize: config.fallbackFontSize,
              fontWeight: 900,
            }}
          >
            {agency.logoInitials}
          </Avatar>
        )}
      </Box>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          minWidth: 0,
          overflow: 'hidden',
          bgcolor: agency.brand.backgroundColor ?? 'grey.100',
          backgroundImage:
            showBanner && agency.bannerUrl ? `url("${agency.bannerUrl}")` : undefined,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          p: config.padding,
          pl: config.paddingLeft,
        }}
      >
        {showBanner ? (
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: agency.bannerUrl ? alpha.white[72] : 'transparent',
              background: agency.bannerUrl ? gradients.agencyBannerVeil : undefined,
            }}
          />
        ) : null}

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            minHeight: '100%',
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              minWidth: 0,
              textAlign: 'center',
              transform: 'translateY(-50%)',
            }}
          >
            <Typography
              noWrap={config.noWrapTitle}
              sx={{
                color: agency.brand.secondaryColor ?? agency.brand.primaryColor ?? 'text.primary',
                fontSize: config.titleFontSize,
                fontWeight: 900,
                lineHeight: config.titleLineHeight,
              }}
            >
              {agency.name}
            </Typography>
            {showHeadquarters && agency.headquarters ? (
              <Typography sx={{ color: 'text.secondary', ...componentText.cardBroker, mt: 1 }}>
                {agency.headquarters}
              </Typography>
            ) : null}
          </Box>

          <Box sx={{ minHeight: 0 }} />

          {agency.legalCreci ? (
            <Typography
              noWrap
              sx={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                color: agency.brand.secondaryColor ?? 'text.primary',
                fontSize: config.creciFontSize,
                fontWeight: 900,
              }}
            >
              {agency.legalCreci}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Box>
  )
}
