import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

const sidebarExpandedWidth = 240
const sidebarCollapsedWidth = 72

const marketplaceActionSx = {
  minHeight: 32,
  px: 1,
  color: alpha.white[62],
  fontSize: 11,
  fontWeight: 600,
  lineHeight: '16px',
  textTransform: 'none',
  '& .MuiButton-startIcon': { mr: 0.75 },
  '&:hover': { bgcolor: alpha.white[8], color: surface.lightText },
} as const

export const styles = {
  box: { position: 'relative', height: '100%' },
  stack: { width: '100%', height: 48, flexShrink: 0, mb: 1.5, position: 'relative' },
  appLogo: { left: '50%', position: 'absolute', top: 0, transform: 'translateX(-50%)' },
  iconButton: { color: 'inherit', position: 'absolute', right: 0, top: 0 },
  icon: { fontSize: iconSize.md },
  box2: { flexGrow: 1, minHeight: 2 },
  logoutOutlinedIcon: { fontSize: iconSize.sm },
  box3: { width: 8, height: 8, borderRadius: radius.full, bgcolor: brand.semantic.success },
  box4: { display: 'flex', minHeight: '100vh', bgcolor: surface.app },
  stack2: {
    display: { xs: 'flex', md: 'none' },
    position: 'fixed',
    inset: '0 0 auto 0',
    zIndex: 20,
    height: 64,
    minHeight: 64,
    maxHeight: 64,
    overflow: 'hidden',
    px: 2,
    bgcolor: surface.paper,
    color: brand.graphite[500],
    boxShadow: shadows.crmMobileHeader,
  },
  appLogo2: {
    height: 42,
    overflow: 'hidden',
    '& img': {
      width: 112,
      maxWidth: 'none',
    },
  },
  iconButton2: {
    width: 42,
    height: 42,
    border: '1px solid',
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.sm}px`,
    color: brand.graphite[500],
  },
  menuRoundedIcon: { fontSize: iconSize.xl },
  paper: { width: 'min(280px, calc(100vw - 48px))', border: 0 },
  marketplaceAction: marketplaceActionSx,
} satisfies Record<string, SxProps<Theme>>

export function getStackStyles({ collapsed }: { collapsed: boolean }): SxProps<Theme> {
  return {
    width: collapsed ? sidebarCollapsedWidth : sidebarExpandedWidth,
    height: '100%',
    bgcolor: brand.graphite[600],
    color: surface.lightText,
    px: collapsed ? 1 : 2,
    py: 2.5,
    transition: 'width 180ms ease, padding 180ms ease',
  }
}

export function getStackStyles2({ collapsed }: { collapsed: boolean }): SxProps<Theme> {
  return { mx: collapsed ? 0 : -0.5 }
}

export function getTypographyStyles({
  collapsed,
  active,
}: {
  collapsed: boolean
  active: boolean
}): SxProps<Theme> {
  return {
    display: collapsed ? 'none' : 'block',
    flex: 1,
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    lineHeight: '20px',
  }
}

export function getButtonStyles({ collapsed }: { collapsed: boolean }): SxProps<Theme> {
  return {
    alignSelf: collapsed ? 'center' : 'stretch',
    justifyContent: collapsed ? 'center' : 'flex-start',
    minWidth: collapsed ? 44 : 0,
    ...styles.marketplaceAction,
    minHeight: 40,
    mb: 1.5,
    px: collapsed ? 0 : 1.5,
    '& .MuiButton-startIcon': { ml: 0, mr: collapsed ? 0 : 0.75 },
  }
}

export function getStackStyles3({ collapsed }: { collapsed: boolean }): SxProps<Theme> {
  return {
    pt: 2,
    px: collapsed ? 0 : 0.9,
    borderTop: '1px solid',
    borderColor: alpha.white[8],
  }
}

export function getTypographyStyles2({ collapsed }: { collapsed: boolean }): SxProps<Theme> {
  return {
    display: collapsed ? 'none' : 'block',
    color: alpha.white[72],
    fontSize: 12,
    fontWeight: 700,
  }
}

export function getBoxStyles({ sidebarCollapsed }: { sidebarCollapsed: boolean }): SxProps<Theme> {
  return {
    display: { xs: 'none', md: 'block' },
    position: 'fixed',
    inset: '0 auto 0 0',
    width: sidebarCollapsed ? sidebarCollapsedWidth : sidebarExpandedWidth,
    zIndex: 10,
    transition: 'width 180ms ease',
  }
}

export function getBoxStyles2({ sidebarCollapsed }: { sidebarCollapsed: boolean }): SxProps<Theme> {
  return {
    width: {
      xs: '100%',
      md: `calc(100% - ${sidebarCollapsed ? sidebarCollapsedWidth : sidebarExpandedWidth}px)`,
    },
    ml: { md: `${sidebarCollapsed ? sidebarCollapsedWidth : sidebarExpandedWidth}px` },
    pt: { xs: '64px', md: 0 },
    minWidth: 0,
    transition: 'margin-left 180ms ease, width 180ms ease',
    '& :focus-visible:not(input, textarea, [role="combobox"]), & .Mui-focusVisible': {
      outline: `2px solid ${brand.magenta[500]}`,
      outlineOffset: 2,
    },
  }
}
