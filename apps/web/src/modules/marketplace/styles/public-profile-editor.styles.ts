import type { SxProps, Theme } from '@mui/material'

import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  page: { width: '100%', p: 3.5 },
  iconMd: { fontSize: iconSize.md },
  iconSm: { fontSize: iconSize.sm },
  loading: { display: 'grid', placeItems: 'center', minHeight: 320 },
  header: { mb: 2.6 },
  actions: { width: { xs: '100%', md: 'auto' }, alignItems: { xs: 'stretch', sm: 'center' } },
  validated: { color: brand.semantic.success },
  validatedText: { fontSize: 13, fontWeight: 800 },
  previewButton: {
    borderColor: alpha.graphite[8],
    '&:hover': { borderColor: alpha.graphite[18], bgcolor: surface.paper, boxShadow: 'none' },
  },
  desktopOnly: { display: { xs: 'none', md: 'block' } },
  form: { width: '100%' },
  layout: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 3fr) minmax(420px, 2fr)' },
    alignItems: { xs: 'start', xl: 'stretch' },
    columnGap: { xs: 2.2, xl: 4 },
    rowGap: 2.2,
  },
  previewContent: { p: 0 },
  panelTitle: { mb: 2 },
  mainFields: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
    gridTemplateRows: { xl: 'auto auto auto auto minmax(0, 1fr)' },
    gap: 1.6,
    flex: 1,
  },
  fullRow: { gridColumn: { md: '1 / -1' } },
  longText: {
    gridColumn: { md: '1 / -1' },
    '& .MuiInputBase-root': { alignItems: 'flex-start', height: { xl: '100%' } },
    '& textarea': { height: { xl: '100% !important' } },
  },
  colorFields: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
    gap: 1.6,
  },
  imageFields: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
    alignItems: 'stretch',
    gap: 1.6,
  },
} satisfies Record<string, SxProps<Theme>>

export function getEditorPanelStyles(fullRow = false): SxProps<Theme> {
  return {
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.propertyCard,
    p: { xs: 2, md: 2.6 },
    display: 'flex',
    flexDirection: 'column',
    ...(fullRow ? { gridColumn: { xl: '1 / -1' } } : {}),
  }
}

export const teamPickerSlotProps = {
  popper: {
    placement: 'bottom-start' as const,
    modifiers: [{ name: 'flip', enabled: false }],
  },
}
