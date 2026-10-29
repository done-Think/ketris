import type { SxProps, Theme } from '@mui/material'

import { componentText, radius, surface } from '@shared/theme/tokens'

export const styles = {
  paper: { borderRadius: `${radius.md}px` },
  title: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    pb: 1.5,
    fontWeight: 800,
  },
  close: { width: 36, height: 36, borderRadius: `${radius.sm}px` },
  content: { pt: 1 },
  field: {
    '& .MuiInputBase-root': {
      borderRadius: `${radius.sm}px`,
      bgcolor: surface.paper,
    },
  },
  option: componentText.menuItem,
  parking: {
    px: 1.4,
    py: 1,
    border: 1,
    borderColor: 'divider',
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
  },
  actions: { px: 3, pb: 2.5, pt: 0 },
  clear: { textTransform: 'none', fontWeight: 700 },
  submit: { borderRadius: `${radius.sm}px`, textTransform: 'none', fontWeight: 800 },
} satisfies Record<string, SxProps<Theme>>
