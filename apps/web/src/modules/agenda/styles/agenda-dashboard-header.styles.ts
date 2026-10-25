import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

export const styles = {
  stack: { flexWrap: 'wrap' } satisfies SxProps<Theme>,
  iconButton: {
    display: { xs: 'none', md: 'inline-flex' },
    width: 36,
    height: 36,
    border: '1px solid',
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
  } satisfies SxProps<Theme>,
  chevronLeftRoundedIcon: { fontSize: iconSize.sm } satisfies SxProps<Theme>,
  typography: {
    display: { xs: 'none', md: 'block' },
    color: brand.graphite[500],
    fontSize: 14,
    fontWeight: 800,
  } satisfies SxProps<Theme>,
  iconButton2: {
    display: { xs: 'none', md: 'inline-flex' },
    width: 36,
    height: 36,
    border: '1px solid',
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
  } satisfies SxProps<Theme>,
  chevronRightRoundedIcon: { fontSize: iconSize.sm } satisfies SxProps<Theme>,
  iconButton3: {
    display: { xs: 'inline-flex', md: 'none' },
    width: 44,
    height: 44,
    bgcolor: brand.magenta[500],
    color: surface.paper,
    '&:hover': { bgcolor: brand.magenta[600] },
  } satisfies SxProps<Theme>,
  addRoundedIcon: { fontSize: iconSize.xl } satisfies SxProps<Theme>,
  addRoundedIcon2: { fontSize: iconSize.sm } satisfies SxProps<Theme>,
  dashboardHeaderActionButton: {
    display: { xs: 'none', md: 'inline-flex' },
  } satisfies SxProps<Theme>,
  box: { display: { xs: 'none', md: 'block' } } satisfies SxProps<Theme>,
}
