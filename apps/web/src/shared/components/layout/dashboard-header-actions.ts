import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

export const dashboardHeaderActionButtonSx = {
  width: { xs: '100%', sm: 'auto' },
  minWidth: { sm: 148 },
  height: { xs: 40, sm: 32 },
  minHeight: { xs: 40, sm: 32 },
  px: 1.4,
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.none,
  fontSize: 13,
  fontWeight: 800,
  lineHeight: '20px',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  '&:hover': {
    boxShadow: shadows.none,
  },
  '& .MuiButton-startIcon': {
    ml: 0,
    mr: 0.75,
  },
  '& .MuiButton-endIcon': {
    ml: 0.75,
    mr: 0,
  },
  '& .MuiSvgIcon-root': {
    fontSize: 16,
  },
} as const

export const dashboardHeaderFilterButtonSx = {
  ...dashboardHeaderActionButtonSx,
  minWidth: { sm: 148 },
  justifyContent: 'space-between',
  borderColor: brand.neutral[100],
  bgcolor: surface.paper,
  color: 'text.secondary',
  '&:hover': {
    borderColor: brand.neutral[200],
    bgcolor: surface.paper,
    boxShadow: shadows.none,
  },
} as const

export const dashboardStatusFilterButtonSx = {
  minWidth: 0,
  minHeight: 34,
  px: 1.6,
  flexShrink: 0,
  gap: 0.6,
  border: 0,
  borderRadius: `${radius.full}px`,
  fontSize: 12,
  fontWeight: 900,
  lineHeight: '20px',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  boxShadow: shadows.none,
  '&:hover': {
    border: 0,
    boxShadow: shadows.none,
  },
} as const

export function dashboardStatusFilterToneSx(active: boolean) {
  return {
    bgcolor: active ? brand.magenta[500] : brand.neutral[50],
    color: active ? surface.lightText : brand.graphite[500],
    '&:hover': {
      bgcolor: active ? brand.magenta[600] : brand.neutral[100],
    },
  } as const
}

export function dashboardStatusFilterCountSx(active: boolean) {
  return {
    display: 'grid',
    minWidth: 18,
    height: 18,
    placeItems: 'center',
    px: 0.5,
    borderRadius: `${radius.full}px`,
    bgcolor: active ? alpha.white[8] : alpha.graphite[6],
    color: active ? surface.lightText : brand.neutral[500],
    fontSize: 10,
    fontWeight: 800,
    lineHeight: 1,
  } as const
}
