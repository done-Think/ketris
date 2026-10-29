import {
  alpha,
  brand,
  dashboardLayout,
  iconSize,
  radius,
  shadows,
  surface,
} from '@shared/theme/tokens'
import { sidebarCollapsedWidth, sidebarExpandedWidth } from '@shared/config/app-shell-layout'

export const styles = {
  box: { display: 'flex', minHeight: '100vh', bgcolor: surface.app },
  box2: (sidebarCollapsed: boolean) =>
    ({
      display: { xs: 'none' },
      [dashboardLayout.desktopMediaQuery]: { display: 'block' },
      position: 'fixed',
      inset: '0 auto 0 0',
      width: sidebarCollapsed ? sidebarCollapsedWidth : sidebarExpandedWidth,
      zIndex: 10,
      transition: 'width 180ms ease',
    }) as const,
  stack: {
    display: { xs: 'flex' },
    [dashboardLayout.desktopMediaQuery]: { display: 'none' },
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
  appLogo: {
    height: 42,
    overflow: 'hidden',
    '& img': {
      width: 112,
      maxWidth: 'none',
    },
  },
  iconButton: {
    width: 42,
    height: 42,
    border: '1px solid',
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.sm}px`,
    color: brand.graphite[500],
  },
  menuRoundedIcon: { fontSize: iconSize.xl },
  paper: { width: sidebarExpandedWidth, border: 0 },
  box3: (sidebarCollapsed: boolean) =>
    ({
      width: '100%',
      minWidth: 0,
      ml: 0,
      transition: 'margin-left 180ms ease, width 180ms ease',
      pt: '64px',
      [dashboardLayout.desktopMediaQuery]: {
        width: `calc(100% - ${sidebarCollapsed ? sidebarCollapsedWidth : sidebarExpandedWidth}px)`,
        ml: `${sidebarCollapsed ? sidebarCollapsedWidth : sidebarExpandedWidth}px`,
        pt: 0,
      },
    }) as const,
} as const
