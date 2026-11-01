import type { SxProps, Theme } from '@mui/material'

import type { StatusTone, StepProgressTone } from '../types'
import { brand, capture, fontFamily, radius, statusPalette, surface } from './tokens'

export const pageHeaderStyles = {
  root: {
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    alignItems: { xs: 'stretch', md: 'flex-start' },
    justifyContent: 'space-between',
    gap: 1.75,
    pb: 1.75,
    borderBottom: '1px solid',
    borderColor: 'divider',
  },
  titleBlock: { minWidth: 0, flex: 1 },
  title: {
    color: brand.graphite[500],
    fontFamily: fontFamily.display,
    fontSize: { xs: 26, sm: 30 },
    fontWeight: 700,
    lineHeight: 1.15,
  },
  subtitle: { color: brand.neutral[500], fontSize: { xs: 13, sm: 14 } },
  actions: {
    flexShrink: 0,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 1.25,
    width: { xs: '100%', md: 'auto' },
  },
} satisfies Record<string, SxProps<Theme>>

export function statusBadgeSx(tone: StatusTone): SxProps<Theme> {
  return {
    minHeight: 26,
    px: 1.25,
    borderRadius: `${radius.full}px`,
    bgcolor: statusPalette[tone].soft,
    color: 'text.primary',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.75,
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    '&::before': {
      content: '""',
      width: 8,
      height: 8,
      borderRadius: `${radius.full}px`,
      bgcolor: statusPalette[tone].dot,
    },
  }
}

export function stepProgressStyles(tone: StepProgressTone) {
  const isDark = tone === 'dark'

  return {
    root: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.75,
      py: 1.5,
    },
    pill: { width: 18, height: 7, borderRadius: `${radius.full}px`, bgcolor: 'primary.main' },
    label: {
      fontSize: 12,
      fontWeight: 700,
      color: isDark ? capture.accentText : brand.magenta[600],
    },
    dot: (reached: boolean) => ({
      width: 7,
      height: 7,
      borderRadius: `${radius.full}px`,
      bgcolor: reached ? 'primary.main' : isDark ? brand.graphite[400] : brand.neutral[300],
    }),
  }
}

export const brandMarkStyles = {
  root: (size: 'sm' | 'md') => ({
    width: size === 'sm' ? 28 : 32,
    height: size === 'sm' ? 28 : 32,
    borderRadius: size === 'sm' ? `${radius.sm}px` : '10px',
    bgcolor: 'primary.main',
    color: surface.lightText,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  }),
  icon: (size: 'sm' | 'md') => ({ fontSize: size === 'sm' ? 17 : 19 }),
}
