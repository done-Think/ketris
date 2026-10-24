import {} from '@shared/theme/tokens'
import type { SxProps, Theme } from '@mui/material'

export const styles = {
  box: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr 1fr', md: '2fr 1fr' },
    gap: { xs: 1.2, md: 2 },
  },
} satisfies Record<string, SxProps<Theme>>

export function getAddressFieldStyles(name: string): SxProps<Theme> {
  return {
    gridColumn: {
      xs: name === 'street' || name === 'zipCode' ? '1 / -1' : 'auto',
    },
  }
}
