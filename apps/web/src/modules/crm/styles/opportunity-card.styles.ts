import type { SxProps, Theme } from '@mui/material'
import type { CrmStatusColors } from '../types/style'

export const stackSx: SxProps<Theme> = { minWidth: 0 }

import { motion, radius, shadows } from '@shared/theme/tokens'

export function getCardSx(isCompact: boolean, indicatorColor: string): SxProps<Theme> {
  return {
    display: 'flex',
    flexDirection: 'column',
    height: isCompact ? 148 : undefined,
    minHeight: isCompact ? 148 : 164,
    p: isCompact ? 2 : 2.25,
    border: '1px solid',
    borderColor: isCompact ? 'transparent' : 'divider',
    borderRadius: isCompact ? `${radius.md}px` : 1.5,
    boxShadow: isCompact ? shadows.crmCardCompact : shadows.crmCard,
    color: 'text.primary',
    textDecoration: 'none',
    transition: motion.transition.card,
    '&:hover': {
      borderColor: indicatorColor,
      boxShadow: shadows.crmCardHover,
      transform: 'translateY(-1px)',
    },
    '&:focus-visible': {
      outline: `2px solid ${indicatorColor}`,
      outlineOffset: 2,
    },
  }
}

export function getTypographySx(isCompact: boolean): SxProps<Theme> {
  return {
    fontSize: isCompact ? 16.5 : 18,
    fontWeight: 700,
    lineHeight: isCompact ? 1.3 : 1.4,
  }
}

export function getTypographySx2(isCompact: boolean): SxProps<Theme> {
  return {
    mt: 0.25,
    color: 'text.secondary',
    fontSize: isCompact ? 14.5 : 15.5,
    lineHeight: isCompact ? 1.35 : 1.45,
  }
}

export function getTypographySx3(isCompact: boolean): SxProps<Theme> {
  return {
    display: isCompact ? 'none' : 'block',
    color: 'text.secondary',
    fontSize: 15,
    lineHeight: 1.4,
  }
}

export function getTypographySx4(isCompact: boolean): SxProps<Theme> {
  return {
    mt: isCompact ? 0.75 : 1,
    color: 'primary.main',
    fontSize: isCompact ? 17 : 18,
    fontWeight: 800,
    lineHeight: isCompact ? 1.35 : 1.4,
  }
}

export function getStackSx(isCompact: boolean): SxProps<Theme> {
  return {
    mt: 'auto',
    pt: isCompact ? 0.75 : 1.1,
    borderTop: '1px solid',
    borderColor: 'divider',
  }
}

export function getAvatarSx(isCompact: boolean, stage: CrmStatusColors): SxProps<Theme> {
  return {
    width: isCompact ? 20 : 24,
    height: isCompact ? 20 : 24,
    bgcolor: stage.softColor,
    color: stage.color,
    fontSize: isCompact ? 12 : 13,
  }
}

export function getAccessTimeRoundedIconSx(isCompact: boolean): SxProps<Theme> {
  return { display: isCompact ? 'none' : 'block', color: 'text.disabled', fontSize: 16 }
}

export function getTypographySx5(isCompact: boolean): SxProps<Theme> {
  return {
    px: isCompact ? 0.625 : 0,
    py: isCompact ? 0.25 : 0,
    borderRadius: isCompact ? '4px' : 0,
    bgcolor: isCompact ? 'grey.100' : 'transparent',
    color: 'text.secondary',
    fontSize: isCompact ? 14 : 14.5,
    lineHeight: isCompact ? 1.2 : 'normal',
  }
}

export function getBoxSx(isCompact: boolean, indicatorColor: string): SxProps<Theme> {
  return {
    width: isCompact ? 6 : 8,
    height: isCompact ? 6 : 8,
    ml: 'auto !important',
    borderRadius: `${radius.full}px`,
    bgcolor: indicatorColor,
  }
}
