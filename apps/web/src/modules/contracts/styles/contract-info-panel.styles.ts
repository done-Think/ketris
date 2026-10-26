import type { SxProps, Theme } from '@mui/material'
import { brand, alpha } from '@shared/theme/tokens'

export const styles = {
  contractDetailPanel: { height: '100%' } satisfies SxProps<Theme>,
  stack: { flex: 1, justifyContent: 'space-between' } satisfies SxProps<Theme>,
  muiLink: { color: brand.magenta[500], fontSize: 15, fontWeight: 900 } satisfies SxProps<Theme>,
}

export const infoRowSx = {
  py: { xs: 1.35, md: 1.65 },
  borderBottom: '1px solid',
  borderColor: alpha.graphite[8],
  '&:last-child': { borderBottom: 0 },
} as const

export const infoLabelSx = { color: brand.neutral[500], fontSize: 15, fontWeight: 700 } as const

export const infoValueSx = {
  color: brand.graphite[500],
  fontSize: 15,
  fontWeight: 900,
  textAlign: 'right',
} as const
