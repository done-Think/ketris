import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, supportColor, surface } from '@shared/theme/tokens'

export const styles = {
  tabs: {
    mb: 3,
    borderBottom: '1px solid',
    borderColor: alpha.graphite[8],
    '& .MuiTab-root': {
      minWidth: 0,
      px: { xs: 0.75, md: 2 },
      fontSize: { xs: 13, md: 14 },
      fontWeight: 800,
      textTransform: 'none',
    },
  },
  rentCard: {
    minHeight: 76,
    p: 2,
    bgcolor: surface.paper,
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.crmCardCompact,
  },
  rentIcon: {
    display: 'grid',
    placeItems: 'center',
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: '50%',
    bgcolor: supportColor.infoSoft,
    color: brand.semantic.info,
  },
  rentText: { minWidth: 0, overflowWrap: 'anywhere' },
  rentLabel: { fontSize: 11.5, color: brand.neutral[500] },
  rentValue: { fontSize: { xs: 19, md: 20 }, fontWeight: 900 },
} satisfies Record<string, SxProps<Theme>>
