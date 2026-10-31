import type { SxProps, Theme } from '@mui/material'

const desktopFieldColumns: Record<string, number> = {
  zipCode: 4,
  street: 8,
  number: 4,
  complement: 8,
  neighborhood: 4,
  city: 4,
  state: 4,
}

export const styles = {
  box: {
    display: 'grid',
    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(12, minmax(0, 1fr))' },
    alignItems: 'start',
    gap: { xs: 1.2, md: 2 },
  },
  locationHint: {
    gridColumn: '1 / -1',
    m: 0,
  },
} satisfies Record<string, SxProps<Theme>>

export function getAddressFieldStyles(name: string): SxProps<Theme> {
  return {
    minWidth: 0,
    gridColumn: {
      xs: ['street', 'zipCode', 'neighborhood'].includes(name) ? '1 / -1' : 'auto',
      md: `span ${desktopFieldColumns[name] ?? 12}`,
    },
  }
}
