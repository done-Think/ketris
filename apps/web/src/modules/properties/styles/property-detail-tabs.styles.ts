import { motion } from '@shared/theme/tokens'
import type { SxProps, Theme } from '@mui/material'

export const styles = {
  stack: { mb: 3, borderBottom: '1px solid', borderColor: 'divider' },
} satisfies Record<string, SxProps<Theme>>

export function getTabStyles(active: boolean): SxProps<Theme> {
  return {
    border: 0,
    pb: 1.2,
    borderBottom: '2px solid',
    borderColor: active ? 'primary.main' : 'transparent',
    color: active ? 'primary.main' : 'text.secondary',
    bgcolor: 'transparent',
    cursor: 'pointer',
    font: 'inherit',
    fontSize: 16,
    fontWeight: active ? 900 : 700,
    transition: motion.transition.bordered,
    '&:hover': { color: 'primary.main' },
  }
}
