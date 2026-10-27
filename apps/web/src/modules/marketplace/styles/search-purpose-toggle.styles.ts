import type { SxProps, Theme } from '@mui/material'

export const styles = {
  button: {
    px: 2,
    textTransform: 'none',
    fontWeight: 600,
    flex: 1,
  },
} satisfies Record<string, SxProps<Theme>>

export function getGroupStyles(fullWidth?: boolean): SxProps<Theme> {
  return {
    alignSelf: 'center',
    mr: { md: 1 },
    width: fullWidth ? '100%' : 'auto',
  }
}
