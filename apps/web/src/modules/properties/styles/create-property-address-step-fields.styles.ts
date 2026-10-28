import type { SxProps, Theme } from '@mui/material'

const desktopFieldColumns: Record<string, number> = {
  zipCode: 3,
  street: 9,
  number: 2,
  complement: 4,
  neighborhood: 6,
  city: 10,
  state: 2,
}

export const styles = {
  box: {
    display: 'grid',
    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(12, minmax(0, 1fr))' },
    alignItems: 'start',
    gap: { xs: 1.2, md: 2 },
  },
  coordinates: {
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    alignItems: 'start',
    columnGap: { xs: 1.2, md: 2 },
    minWidth: 0,
  },
  coordinatesHint: {
    gridColumn: '1 / -1',
    mt: 0.5,
    mx: 1.75,
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
