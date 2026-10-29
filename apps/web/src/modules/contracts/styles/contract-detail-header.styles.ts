import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius } from '@shared/theme/tokens'
import type { ContractStatusStyle } from '../types/contract'

export const styles = {
  stack: { mb: 2.8 } satisfies SxProps<Theme>,
  box: { minWidth: 0 } satisfies SxProps<Theme>,
  stack2: { flexWrap: 'wrap', rowGap: 1, mb: 0.8 } satisfies SxProps<Theme>,
  typography: {
    color: brand.graphite[500],
    fontSize: { xs: 30, md: 36 },
    fontWeight: 900,
  } satisfies SxProps<Theme>,
  chip: (statusStyle: ContractStatusStyle): SxProps<Theme> => ({
    height: { xs: 38, md: 44 },
    borderRadius: `${radius.sm}px`,
    bgcolor: statusStyle.bgcolor,
    color: statusStyle.color,
    fontSize: { xs: 30, md: 36 },
    fontWeight: 900,
  }),
  stack3: { flexWrap: 'wrap', rowGap: 1 } satisfies SxProps<Theme>,
  button: {
    borderColor: alpha.error[10],
    color: brand.semantic.error,
    '&:hover': { borderColor: brand.semantic.error, bgcolor: alpha.error[6] },
  } satisfies SxProps<Theme>,
}
