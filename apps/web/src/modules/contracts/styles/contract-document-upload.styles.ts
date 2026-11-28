import type { SxProps, Theme } from '@mui/material'
import { brand, radius, surface } from '@shared/theme/tokens'

export const styles = {
  label: {
    color: brand.graphite[500],
    fontSize: 12,
    fontWeight: 900,
    mb: 0.8,
  } satisfies SxProps<Theme>,
  selector: {
    p: 1.5,
    minWidth: 0,
    border: '1px solid',
    borderColor: brand.neutral[200],
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    alignItems: { xs: 'stretch', sm: 'center' },
    '.Mui-error &': { borderColor: 'error.main' },
  } satisfies SxProps<Theme>,
  chooseButton: { flexShrink: 0 } satisfies SxProps<Theme>,
  fileName: {
    minWidth: 0,
    color: brand.neutral[500],
    fontSize: 13,
    overflowWrap: 'anywhere',
  } satisfies SxProps<Theme>,
}
