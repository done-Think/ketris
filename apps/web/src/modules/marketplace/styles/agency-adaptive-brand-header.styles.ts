import type { SxProps, Theme } from '@mui/material'

import { alpha, componentText, gradients, radius } from '@shared/theme/tokens'

import type {
  AgencyAdaptiveBrandHeaderVariant,
  AgencyBrand,
  AgencyProfile,
  BrandHeaderConfig,
} from '../types/agency'

export const brandHeaderConfig = {
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
} satisfies Record<AgencyAdaptiveBrandHeaderVariant, BrandHeaderConfig>

export const styles = {
  logo: {
    position: 'absolute',
    top: '50%',
    left: 0,
    zIndex: 3,
    width: 'auto',
    height: '100%',
    maxWidth: 'none',
    objectFit: 'contain',
    transform: 'translateY(-50%)',
  },
  content: { position: 'relative', zIndex: 1, minHeight: '100%', minWidth: 0 },
  titleBlock: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    minWidth: 0,
    textAlign: 'center',
    transform: 'translateY(-50%)',
  },
  headquarters: { color: 'text.secondary', ...componentText.cardBroker, mt: 1 },
} satisfies Record<string, SxProps<Theme>>

export function getHeaderStyles(config: BrandHeaderConfig, overflow: number): SxProps<Theme> {
  return {
    '--agency-logo-overflow': `${overflow}px`,
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
  }
}

export function getLogoSlotStyles(backgroundColor: string | null): SxProps<Theme> {
  return {
    display: 'grid',
    placeItems: 'center',
    minWidth: 0,
    position: 'relative',
    zIndex: 3,
    overflow: 'visible',
    bgcolor: backgroundColor ?? 'background.paper',
  }
}

export function getFallbackLogoStyles(
  brand: AgencyBrand,
  config: BrandHeaderConfig,
): SxProps<Theme> {
  return {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    bgcolor: brand.backgroundColor ?? 'background.paper',
    color: brand.primaryColor,
    boxShadow: 'none',
    fontSize: config.fallbackFontSize,
    fontWeight: 900,
  }
}

export function getBannerStyles(
  agency: Pick<AgencyProfile, 'brand' | 'bannerUrl'>,
  config: BrandHeaderConfig,
  showBanner: boolean,
): SxProps<Theme> {
  return {
    position: 'relative',
    zIndex: 1,
    minWidth: 0,
    overflow: 'hidden',
    bgcolor: agency.brand.backgroundColor ?? 'grey.100',
    backgroundImage: showBanner && agency.bannerUrl ? `url("${agency.bannerUrl}")` : undefined,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    p: config.padding,
    pl: config.paddingLeft,
  }
}

export function getBannerVeilStyles(hasBanner: boolean): SxProps<Theme> {
  return {
    position: 'absolute',
    inset: 0,
    bgcolor: hasBanner ? alpha.white[72] : 'transparent',
    background: hasBanner ? gradients.agencyBannerVeil : undefined,
  }
}

export function getTitleStyles(brand: AgencyBrand, config: BrandHeaderConfig): SxProps<Theme> {
  return {
    color: brand.secondaryColor ?? brand.primaryColor ?? 'text.primary',
    fontSize: config.titleFontSize,
    fontWeight: 900,
    lineHeight: config.titleLineHeight,
  }
}

export function getCreciStyles(brand: AgencyBrand, config: BrandHeaderConfig): SxProps<Theme> {
  return {
    position: 'absolute',
    right: 0,
    bottom: 0,
    color: brand.secondaryColor ?? 'text.primary',
    fontSize: config.creciFontSize,
    fontWeight: 900,
  }
}
