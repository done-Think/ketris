import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, shadows, surface, supportColor } from '@shared/theme/tokens'

const searchSx = {
  flex: 1,
  maxWidth: { md: 360 },
  '& .MuiInputBase-root': {
    height: { xs: 40, sm: 32 },
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    fontSize: 12,
  },
}

const filterSx = {
  minWidth: { xs: '100%', md: 170 },
  height: { xs: 40, sm: 32 },
  borderRadius: `${radius.sm}px`,
  bgcolor: surface.paper,
  fontSize: 12,
}

const tablePanelSx = {
  overflow: 'hidden',
  borderColor: alpha.graphite[6],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
  bgcolor: surface.paper,
  '& .MuiTableCell-head': {
    bgcolor: brand.neutral[50],
    color: brand.neutral[500],
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
  },
  '& .MuiTableCell-body': { borderColor: alpha.graphite[6], py: 1.25 },
}

const cellSx = { color: brand.neutral[500], fontSize: 12.5 }

const labelSx = { color: brand.neutral[500], fontSize: 11, fontWeight: 800 }

const roleBadgeSx = {
  display: 'inline-flex',
  borderRadius: `${radius.full}px`,
  bgcolor: alpha.magenta[6],
  color: brand.magenta[600],
  fontSize: 11,
  fontWeight: 800,
  px: 1,
  py: 0.45,
}

const statusBadgeSx = {
  display: 'inline-flex',
  borderRadius: `${radius.full}px`,
  fontSize: 11,
  fontWeight: 800,
  px: 1,
  py: 0.45,
}

const activeSx = { bgcolor: supportColor.successSoft, color: brand.semantic.success }

const inactiveSx = { bgcolor: brand.neutral[100], color: brand.neutral[500] }

export const styles = {
  box: { width: '100%', p: 3.5 },
  searchRoundedIcon: { color: brand.neutral[400], fontSize: 18 },
  box2: { display: { xs: 'none', md: 'block' }, overflowX: 'auto' },
  table: { minWidth: 980 },
  stack: { display: { xs: 'flex', md: 'none' } },
  stack2: { px: 2, py: 1.75, borderBottom: '1px solid', borderColor: alpha.graphite[6] },
  stack3: { minWidth: 0 },
  avatar: { width: 32, height: 32, bgcolor: brand.magenta[500], fontSize: 12, fontWeight: 800 },
  typography: { color: brand.graphite[500], fontSize: 13, fontWeight: 800 },
  box3: { width: 6, height: 6, borderRadius: radius.full, bgcolor: 'currentColor' },
  stack4: { p: 2.2 },
  paper: { ...tablePanelSx, py: 7, textAlign: 'center' },
  box4: { color: brand.neutral[400], '& svg': { fontSize: 32 } },
  typography2: { color: brand.graphite[500], fontSize: 16, fontWeight: 800 },
  typography3: { color: brand.neutral[500], fontSize: 13, maxWidth: 420 },
  search: searchSx,
  filter: filterSx,
  tablePanel: tablePanelSx,
  cell: cellSx,
  label: labelSx,
  roleBadge: roleBadgeSx,
  statusBadge: statusBadgeSx,
  active: activeSx,
  inactive: inactiveSx,
} satisfies Record<string, SxProps<Theme>>

export function getStackStyles({ active }: { active: boolean }): SxProps<Theme> {
  return { ...styles.statusBadge, ...(active ? styles.active : styles.inactive) }
}
