import type { SxProps, Theme } from '@mui/material'

const desktopFieldColumns: Record<string, number> = {
  zipCode: 4,
  street: 8,
  number: 3,
  complement: 9,
  neighborhood: 5,
  city: 5,
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
    gridTemplateColumns: {
      xs: 'repeat(2, minmax(0, 1fr))',
      md: 'repeat(3, minmax(0, 1fr))',
    },
    alignItems: 'start',
    columnGap: { xs: 1.2, md: 2 },
    minWidth: 0,
  },
  coordinatesHint: {
    gridColumn: { xs: '1 / -1', md: 'auto' },
    alignSelf: { md: 'center' },
    mt: { xs: 0.5, md: 0 },
    mx: { xs: 1.75, md: 0 },
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
