import type { SxProps, Theme } from '@mui/material'
import { brand, radius } from '@shared/theme/tokens'

export const styles = {
  picker: { display: 'flex', p: 1, gap: 1 } satisfies SxProps<Theme>,
  heading: { px: 1.5, py: 0.5, fontSize: 12, fontWeight: 700 } satisfies SxProps<Theme>,
  options: { maxHeight: 240, overflowY: 'auto', minWidth: 76 } satisfies SxProps<Theme>,
  option: {
    justifyContent: 'center',
    borderRadius: `${radius.sm}px`,
    fontVariantNumeric: 'tabular-nums',
    '&.Mui-selected': { color: brand.magenta[600], fontWeight: 700 },
  } satisfies SxProps<Theme>,
}
