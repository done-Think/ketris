import { brand, dashboardLayout } from '@shared/theme/tokens'

export const styles = {
  box: { minWidth: 0, flex: 1 },
  typography: {
    color: brand.graphite[500],
    fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
    fontSize: { xs: 26, sm: 30 },
    fontWeight: 700,
    lineHeight: 1.15,
  },
  typography2: { color: brand.neutral[500], fontSize: { xs: 13, sm: 14 } },
  box2: {
    flexShrink: 0,
    width: '100%',
    [dashboardLayout.desktopMediaQuery]: { width: 'auto' },
  },
} as const
