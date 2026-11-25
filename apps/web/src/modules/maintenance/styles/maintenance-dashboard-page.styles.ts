import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, dashboardLayout, radius, surface } from '@shared/theme/tokens'

export const compactFieldSx = {
  width: { xs: '100%', sm: 200 },
  '& .MuiInputBase-root': {
    height: { xs: 40, sm: 32 },
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    fontSize: 12,
    color: brand.neutral[600],
  },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha.graphite[8] },
} as const

export const stackSx: SxProps<Theme> = {
  width: '100%',
  [dashboardLayout.desktopMediaQuery]: { width: 'auto' },
  alignItems: { sm: 'center' },
  flexWrap: { sm: 'wrap' },
  justifyContent: { sm: 'flex-end' },
}

export const categoryFilterSx: SxProps<Theme> = {
  ...compactFieldSx,
  width: { xs: '100%', sm: 180 },
  display: { xs: 'none', md: 'block' },
}

export const searchRoundedIconSx: SxProps<Theme> = { fontSize: 16, color: brand.neutral[400] }

export const apartmentOutlinedIconSx: SxProps<Theme> = { fontSize: 17 }

export const filterListRoundedIconSx: SxProps<Theme> = { fontSize: 16 }

export const buttonSx: SxProps<Theme> = {
  display: { xs: 'inline-flex', md: 'none' },
  height: { xs: 40, sm: 32 },
  px: 1.5,
  borderRadius: `${radius.sm}px`,
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

export const boxSx: SxProps<Theme> = { display: { xs: 'none', md: 'block' } }

export const boxSx2: SxProps<Theme> = { width: '100%', p: 3.5 }

export const toolbarSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: 2, md: 2.7 },
  mt: '14px !important',
  [dashboardLayout.desktopMediaQuery]: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    columnGap: 1.8,
    alignItems: 'start',
  },
}

export const statusFiltersSx: SxProps<Theme> = { minWidth: 0, gridColumn: '1 / -1' }

export const ownerStatusFiltersSx: SxProps<Theme> = {
  [dashboardLayout.desktopMediaQuery]: { gridColumn: '1 / span 2' },
}

export const secondaryActionsSx: SxProps<Theme> = {
  flexShrink: 0,
  alignItems: { xs: 'stretch', sm: 'flex-end' },
  [dashboardLayout.desktopMediaQuery]: {
    gridColumn: 3,
    gridRow: '1 / span 2',
    alignSelf: 'start',
    minWidth: 0,
  },
  '& > .MuiToggleButtonGroup-root': { flexShrink: 0 },
  '& .MuiToggleButton-root': { flex: { xs: 1, sm: 'initial' } },
}

export const secondaryButtonsSx: SxProps<Theme> = {
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  '& > .MuiButton-root': { whiteSpace: 'nowrap' },
}

export const boxSx3: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'repeat(3, minmax(0, 1fr))',
    sm: 'repeat(3, minmax(0, 1fr))',
  },
  gap: { xs: 0.8, sm: 1.8 },
  [dashboardLayout.desktopMediaQuery]: { display: 'contents' },
}

export const dialogTitleSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
}

export const stackSx2: SxProps<Theme> = { pt: 0.5 }

export const editOutlinedIconSx: SxProps<Theme> = { mr: 1, fontSize: 18 }

export const menuItemSx: SxProps<Theme> = { color: 'error.main' }

export const extraStyleSx1: SxProps<Theme> = {
  borderRadius: `${radius.sm}px`,
  maxHeight: 'calc(100% - 32px)',
}

export const extraStyleSx2: SxProps<Theme> = {
  ...compactFieldSx,
  width: { xs: '100%', sm: 180 },
  display: { xs: 'none', md: 'block' },
  '& .MuiSelect-select': { pr: 4.5 },
}
