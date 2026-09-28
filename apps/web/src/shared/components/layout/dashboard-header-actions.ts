import { radius, shadows } from '@shared/theme/tokens'

export const dashboardHeaderActionButtonSx = {
  width: { xs: '100%', sm: 178 },
  height: 36,
  minHeight: 36,
  px: 2,
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.none,
  fontSize: 14,
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
