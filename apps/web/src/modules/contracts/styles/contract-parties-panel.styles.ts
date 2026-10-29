import type { SxProps, Theme } from '@mui/material'
import { brand, radius, supportColor, surface } from '@shared/theme/tokens'

export const styles = {
  contractDetailPanel: { flex: 1 } satisfies SxProps<Theme>,
  stack: {
    minHeight: 58,
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.app,
    px: 1.6,
  } satisfies SxProps<Theme>,
  box: { flex: 1, minWidth: 0 } satisfies SxProps<Theme>,
  typography: {
    color: brand.graphite[500],
    fontSize: 14,
    fontWeight: 900,
  } satisfies SxProps<Theme>,
  typography2: {
    color: brand.neutral[500],
    fontSize: 11,
    fontWeight: 700,
  } satisfies SxProps<Theme>,
  chip: {
    height: 26,
    borderRadius: `${radius.sm}px`,
    bgcolor: supportColor.successSoft,
    color: brand.semantic.success,
    fontSize: 11,
    fontWeight: 900,
  } satisfies SxProps<Theme>,
  button: {
    borderRadius: `${radius.sm}px`,
    fontSize: 11,
    fontWeight: 900,
  } satisfies SxProps<Theme>,
}
