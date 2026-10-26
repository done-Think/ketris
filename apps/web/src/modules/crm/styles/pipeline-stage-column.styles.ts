import type { SxProps, Theme } from '@mui/material'
import { brand, radius, surface } from '@shared/theme/tokens'
import type { CrmStatusColors } from '../types/style'

export const stackSx: SxProps<Theme> = {
  minWidth: 0,
  minHeight: { xs: 548, md: 0 },
  scrollSnapAlign: 'start',
}

export const stackSx2: SxProps<Theme> = {
  minHeight: 38,
  pb: 0.75,
  borderBottom: '1px solid',
  borderColor: 'divider',
}

export const stackSx3: SxProps<Theme> = {
  pt: { xs: 2, lg: 1.75 },
  pb: { md: 1.5 },
  mx: { md: -0.5 },
  px: { md: 0.5 },
  flex: { md: 1 },
  minHeight: { md: 0 },
  overflowY: { md: 'auto' },
  scrollbarWidth: 'thin',
}

export const skeletonSx: SxProps<Theme> = { borderRadius: `${radius.md}px` }

export const stackSx4: SxProps<Theme> = {
  minHeight: 124,
  px: 1.5,
  border: '1px dashed',
  borderColor: brand.neutral[200],
  borderRadius: `${radius.md}px`,
  bgcolor: surface.paper,
  textAlign: 'center',
}

export const typographySx: SxProps<Theme> = { fontSize: 15.5 }

export const boxSx: SxProps<Theme> = {
  mt: 'auto',
  pt: { xs: 1.25, lg: 1.5 },
  borderTop: '1px solid',
  borderColor: 'divider',
}

export const typographySx2: SxProps<Theme> = {
  color: 'text.disabled',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: '0.01em',
  textTransform: 'uppercase',
}

export const typographySx3: SxProps<Theme> = {
  mt: 0.25,
  fontSize: 17,
  fontWeight: 800,
  lineHeight: 1.3,
}

export const typographySx4: SxProps<Theme> = {
  color: 'text.secondary',
  fontSize: 13.5,
  lineHeight: 1.2,
}

export const typographySx5: SxProps<Theme> = { fontSize: 17, fontWeight: 800, lineHeight: 1.3 }

export function getBoxSx(stage: CrmStatusColors): SxProps<Theme> {
  return {
    width: 7,
    height: 7,
    mr: 0.75,
    flexShrink: 0,
    borderRadius: `${radius.full}px`,
    bgcolor: stage.color,
  }
}

export function getBoxSx2(stage: CrmStatusColors): SxProps<Theme> {
  return {
    display: 'inline-grid',
    placeItems: 'center',
    minWidth: 24,
    height: 22,
    ml: 'auto',
    px: 0.625,
    borderRadius: `${radius.full}px`,
    bgcolor: stage.softColor,
    color: stage.color,
    fontSize: 14.5,
    fontWeight: 700,
  }
}

export function getStackSx(projectedTotals: readonly unknown[]): SxProps<Theme> {
  return { mt: 0.25, minHeight: projectedTotals.length > 1 ? 36 : 0 }
}

export const pipelineBodyFontFamily = 'var(--font-inter), system-ui, -apple-system, sans-serif'
export const pipelineStageLabelSx = {
  fontFamily: pipelineBodyFontFamily,
  fontSize: 14.5,
  fontWeight: 700,
  lineHeight: '18px',
  letterSpacing: 0,
  fontSynthesis: 'none',
  textTransform: 'uppercase',
} as const
