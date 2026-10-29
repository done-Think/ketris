import type { SxProps, Theme } from '@mui/material'
import { brand, radius, supportColor } from '@shared/theme/tokens'

export const styles = {
  box: {
    width: '100%',
    p: 3.5,
  },
  stack: { pb: 1.75, mb: 2.4, borderBottom: '1px solid', borderColor: 'divider' },
  typography: {
    color: brand.graphite[500],
    fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
    fontSize: { xs: 26, sm: 30 },
    lineHeight: 1.15,
    fontWeight: 700,
  },
  chip: {
    bgcolor: supportColor.successSoft,
    border: '1px solid',
    borderColor: brand.semantic.success,
    color: brand.semantic.success,
    borderRadius: `${radius.full}px`,
    fontSize: 10,
    fontWeight: 800,
    height: 24,
  },
  stack2: { color: brand.neutral[500] },
  accessTimeOutlinedIcon: { fontSize: 17 },
  typography2: { fontSize: 12, fontWeight: 600 },
  box2: { mt: 3 },
  typography3: { color: brand.graphite[500], fontSize: 17, fontWeight: 900, mb: 2 },
} satisfies Record<string, SxProps<Theme>>
