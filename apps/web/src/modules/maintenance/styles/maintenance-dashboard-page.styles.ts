import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, surface } from '@shared/theme/tokens'

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
  width: { xs: '100%', lg: 'auto' },
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

export const dashboardPageHeaderSx: SxProps<Theme> = {
  flexWrap: { md: 'wrap' },
  rowGap: { md: 1.6 },
  '& > :first-of-type': { minWidth: { md: 240 } },
  '& > :last-of-type': { ml: { md: 'auto' }, maxWidth: '100%' },
}

export const boxSx3: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'repeat(3, minmax(0, 1fr))',
    sm: 'repeat(3, minmax(0, 1fr))',
  },
  gap: { xs: 0.8, sm: 1.8 },
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
