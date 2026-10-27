'use client'

import { Avatar, Box, Typography } from '@mui/material'

import { useLogoOverflow } from '../hooks/use-logo-overflow'
import {
  brandHeaderConfig,
  getBannerStyles,
  getBannerVeilStyles,
  getCreciStyles,
  getFallbackLogoStyles,
  getHeaderStyles,
  getLogoSlotStyles,
  getTitleStyles,
  styles,
} from '../styles/agency-adaptive-brand-header.styles'

import type { AgencyAdaptiveBrandHeaderProps } from '../types/agency'

export function AgencyAdaptiveBrandHeader({
  agency,
  variant,
  showBanner = false,
  showHeadquarters = false,
}: AgencyAdaptiveBrandHeaderProps) {
  const config = brandHeaderConfig[variant]
  const logoUrl = agency.brand.logoUrl
  const { slotRef, imageRef, overflow, measure } = useLogoOverflow(logoUrl, variant)

  return (
    <Box
      aria-label={agency.legalCreci ? `${agency.name}, ${agency.legalCreci}` : agency.name}
      sx={getHeaderStyles(config, overflow)}
    >
      <Box ref={slotRef} sx={getLogoSlotStyles(agency.brand.backgroundColor)}>
        {logoUrl ? (
          <Box
            component="img"
            ref={imageRef}
            src={logoUrl}
            alt={agency.name}
            onLoad={measure}
            sx={styles.logo}
          />
        ) : (
          <Avatar variant="rounded" sx={getFallbackLogoStyles(agency.brand, config)}>
            {agency.logoInitials}
          </Avatar>
        )}
      </Box>

      <Box sx={getBannerStyles(agency, config, showBanner)}>
        {showBanner ? (
          <Box aria-hidden="true" sx={getBannerVeilStyles(Boolean(agency.bannerUrl))} />
        ) : null}

        <Box sx={styles.content}>
          <Box sx={styles.titleBlock}>
            <Typography noWrap={config.noWrapTitle} sx={getTitleStyles(agency.brand, config)}>
              {agency.name}
            </Typography>
            {showHeadquarters && agency.headquarters ? (
              <Typography sx={styles.headquarters}>{agency.headquarters}</Typography>
            ) : null}
          </Box>

          {agency.legalCreci ? (
            <Typography noWrap sx={getCreciStyles(agency.brand, config)}>
              {agency.legalCreci}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Box>
  )
}
