import type { SxProps, Theme } from '@mui/material/styles'

type SxArray = Extract<SxProps<Theme>, readonly unknown[]>

function isArray(value: SxProps<Theme>): value is SxArray {
  return Array.isArray(value)
}

export function combineSx(...values: (SxProps<Theme> | undefined)[]): SxProps<Theme> {
  const combined: SxArray[number][] = []
  for (const value of values) {
    if (value === undefined) continue
    if (isArray(value)) combined.push(...value)
    else combined.push(value)
  }
  return combined
}
