import type { SxProps, Theme } from '@mui/material'

import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

const teamBodyFontFamily =
  'var(--font-primary), system-ui, -apple-system, BlinkMacSystemFont, sans-serif'

export const styles = {
  page: { width: '100%', p: 3.5 },
  headerActions: { width: { xs: '100%', lg: 'auto' } },
  search: {
    width: { xs: '100%', sm: 300 },
    '& .MuiOutlinedInput-root': {
      height: { xs: 40, sm: 32 },
      bgcolor: surface.paper,
      borderRadius: `${radius.sm}px`,
      fontSize: 12,
    },
  },
  searchIcon: { color: brand.neutral[400], fontSize: iconSize.sm },
  inviteIcon: { fontSize: iconSize.sm },
  notifications: { display: { xs: 'none', md: 'block' } },
  body: {
    fontFamily: teamBodyFontFamily,
    '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root': {
      fontFamily: teamBodyFontFamily,
    },
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      md: 'repeat(2, minmax(0, 1fr))',
      xl: 'repeat(3, minmax(0, 1fr))',
    },
    gap: 1.8,
  },
  emptyPanel: {
    display: 'grid',
    minHeight: 180,
    placeItems: 'center',
    gap: 1.2,
    p: 3,
    textAlign: 'center',
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.md}px`,
    bgcolor: surface.paper,
  },
  emptyText: { color: brand.neutral[500], fontSize: 13, fontWeight: 700 },
} satisfies Record<string, SxProps<Theme>>
