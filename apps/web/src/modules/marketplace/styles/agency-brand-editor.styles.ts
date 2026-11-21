import type { SxProps, Theme } from '@mui/material'
import type { SystemStyleObject } from '@mui/system'

import { alpha, brand, radius, surface } from '@shared/theme/tokens'

import type { AgencyBrandColorField } from '../types/agency-brand-editor'

const emptySwatchBackground = `repeating-linear-gradient(45deg, ${surface.paper} 0 4px, ${brand.neutral[100]} 4px 8px)`

export const styles = {
  summary: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' },
    alignItems: 'center',
    gap: 2,
  },
  summaryPreview: { minWidth: 0 },
  summaryInfo: { display: 'flex', flexDirection: 'column', gap: 1.2, alignItems: 'flex-start' },
  summaryDots: { display: 'flex', gap: 0.8 },
  summaryStatus: { mt: 1.6 },
  summaryMissing: { color: 'error.main', fontSize: 13, fontWeight: 600 },
  summaryReady: { color: 'success.main', fontSize: 13, fontWeight: 600 },
  dialogTitle: { display: 'flex', alignItems: 'center', gap: 1, pr: 1 },
  dialogTitleText: { flex: 1 },
  dialogPaper: { height: { md: 'calc(100% - 64px)' } },
  dialogContent: {
    p: 0,
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '380px minmax(0, 1fr)' },
    gridTemplateRows: { md: 'minmax(0, 1fr)' },
    overflowY: { xs: 'auto', md: 'hidden' },
  },
  controls: {
    p: { xs: 2, md: 2.5 },
    display: 'flex',
    flexDirection: 'column',
    gap: 2.5,
    borderRight: { md: '1px solid' },
    borderBottom: { xs: '1px solid', md: 'none' },
    borderColor: { xs: 'divider', md: 'divider' },
    overflowY: { md: 'auto' },
  },
  section: { display: 'flex', flexDirection: 'column', gap: 1.2 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: 'text.secondary',
  },
  palettes: { display: 'flex', flexWrap: 'wrap', gap: 1 },
  paletteSwatch: { width: 14, height: 26 },
  colorRow: {
    display: 'grid',
    gridTemplateColumns: '40px minmax(0, 1fr)',
    gap: 1.4,
    alignItems: 'start',
    p: 1,
    borderRadius: `${radius.sm}px`,
    '&:hover': { bgcolor: surface.app },
  },
  colorPicker: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    border: 0,
    p: 0,
  },
  colorText: { display: 'flex', flexDirection: 'column', gap: 0.8, minWidth: 0 },
  colorHelp: { fontSize: 12, color: 'text.secondary', lineHeight: 1.35 },
  requiredTag: { fontSize: 11, fontWeight: 800, color: 'primary.main' },
  previewSide: {
    bgcolor: surface.app,
    p: { xs: 2, md: 2.5 },
    display: 'flex',
    flexDirection: 'column',
    gap: 1.5,
    minWidth: 0,
    overflowY: { md: 'auto' },
  },
  previewProfile: { display: 'flex', flexDirection: 'column', gap: 2, pointerEvents: 'none' },
  previewCards: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
    gap: 2,
    pointerEvents: 'none',
  },
  previewCardList: { gridColumn: { lg: '1 / -1' } },
  dialogActions: { px: { xs: 2, md: 2.5 }, py: 1.5, gap: 1, flexWrap: 'wrap' },
  dialogActionsSpacer: { flex: 1, display: { xs: 'none', sm: 'block' } },
  footerButton: { flex: { xs: 1, sm: 'none' } },
} satisfies Record<string, SxProps<Theme>>

export function getColorDotStyles(color: string, size = 22): SxProps<Theme> {
  return {
    width: size,
    height: size,
    borderRadius: '50%',
    border: '1px solid',
    borderColor: alpha.graphite[16],
    flex: '0 0 auto',
    background: color || emptySwatchBackground,
  }
}

export function getColorSwatchStyles(color: string): SxProps<Theme> {
  return {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: `${radius.sm}px`,
    border: '1px solid',
    borderColor: alpha.graphite[16],
    overflow: 'hidden',
    background: color || emptySwatchBackground,
  }
}

export function getPaletteButtonStyles(selected: boolean): SxProps<Theme> {
  return {
    display: 'flex',
    p: 0,
    minWidth: 0,
    borderRadius: `${radius.sm}px`,
    overflow: 'hidden',
    border: '2px solid',
    borderColor: selected ? 'text.primary' : 'transparent',
    '&:hover': { borderColor: selected ? 'text.primary' : brand.neutral[300] },
  }
}

export function getPreviewPanelStyles(
  panel: SystemStyleObject<Theme>,
  highlightedColor: AgencyBrandColorField | null,
): SystemStyleObject<Theme> {
  if (!highlightedColor) return panel

  return {
    ...panel,
    [`& [data-brand-color~="${highlightedColor}"]`]: {
      outlineWidth: 2,
      outlineStyle: 'dashed',
      outlineColor: 'text.primary',
      outlineOffset: 2,
    },
  }
}

export function getPaletteColorStyles(color: string): SxProps<Theme> {
  return { ...styles.paletteSwatch, bgcolor: color }
}
