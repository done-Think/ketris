import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

const avatarSx = {
  width: 34,
  height: 34,
  bgcolor: alpha.magenta[8],
  color: brand.magenta[500],
  fontSize: 12.5,
  fontWeight: 800,
}

const nameLinkSx = {
  color: brand.graphite[500],
  fontWeight: 700,
  textDecoration: 'none',
  '&:hover': { color: brand.magenta[500], textDecoration: 'underline' },
}

const slugSx = { color: brand.neutral[500], fontSize: 12, fontFamily: 'monospace' }

const visuallyHiddenSx = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
} as const

const filterSearchSx = {
  flex: { sm: 1 },
  width: { xs: '100%', sm: 'auto' },
  maxWidth: { sm: 360 },
  minWidth: { lg: 280 },
  '& .MuiInputBase-root': {
    height: { xs: 40, sm: 32 },
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    fontSize: 12,
  },
}

const filterSelectSx = {
  minWidth: { xs: '100%', sm: 170 },
  height: { xs: 40, sm: 32 },
  borderRadius: `${radius.sm}px`,
  bgcolor: surface.paper,
  fontSize: 12,
}

export const styles = {
  card: {
    bgcolor: surface.paper,
    borderColor: alpha.graphite[6],
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.propertyCard,
  },
  stack: {
    borderBottom: '1px solid',
    borderColor: alpha.graphite[6],
    pr: { xs: 1.6, md: 2.2 },
  },
  tabs: { px: { xs: 1, md: 1.6 }, minHeight: 48, flex: 1, minWidth: 0 },
  tab: { textTransform: 'none', fontWeight: 700, minHeight: 48 },
  chip: { height: 20, fontWeight: 800 },
  typography: {
    display: { xs: 'none', sm: 'block' },
    color: brand.neutral[500],
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
  stack2: { py: 6 },
  stack3: { py: 6, px: 3, textAlign: 'center' },
  typography2: { color: brand.graphite[500], fontSize: 15, fontWeight: 800 },
  box: { listStyle: 'none', m: 0, p: 0 },
  stack4: {
    px: 2,
    py: 1.6,
    borderBottom: '1px solid',
    borderColor: alpha.graphite[6],
    '&:last-of-type': { borderBottom: 0 },
  },
  box2: { minWidth: 0, flex: 1 },
  typography3: { ...slugSx, overflowWrap: 'anywhere' },
  stack5: { mt: 1 },
  typography4: { color: brand.graphite[500], fontSize: 13.5, fontWeight: 800, mt: 0.8 },
  box3: { color: brand.neutral[500], fontWeight: 500 },
  iconButton: { color: brand.neutral[500], alignSelf: 'flex-start' },
  editOutlinedIcon: { fontSize: iconSize.sm },
  stack6: { minWidth: 220 },
  box4: { minWidth: 0 },
  tableCell: { whiteSpace: 'nowrap' },
  box5: { fontWeight: 700 },
  iconButton2: { color: brand.neutral[500] },
  searchRoundedIcon: { color: brand.neutral[400], fontSize: 18 },
  avatar: avatarSx,
  nameLink: nameLinkSx,
  visuallyHidden: visuallyHiddenSx,
  slug: slugSx,
  filterSearch: filterSearchSx,
  filterSelect: filterSelectSx,
} satisfies Record<string, SxProps<Theme>>
