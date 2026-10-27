import type { SxProps, Theme } from '@mui/material'
import { iconSize, radius, surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    minWidth: 0,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.sm}px`,
    px: 1,
    py: 1,
    bgcolor: surface.app,
  },
  icon: { color: 'text.secondary', fontSize: iconSize.xs },
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles({
  gridTemplateColumns,
}: {
  gridTemplateColumns: string | Record<string, string>
}): SxProps<Theme> {
  return {
    display: 'grid',
    gridTemplateColumns,
    gap: 1,
    mt: 2,
  }
}

export function getTypographyStyles({
  labelFontWeight,
}: {
  labelFontWeight: number
}): SxProps<Theme> {
  return { color: 'text.secondary', fontSize: 10, fontWeight: labelFontWeight }
}

export function getTypographyStyles2({
  labelFontWeight,
}: {
  labelFontWeight: number
}): SxProps<Theme> {
  return { color: 'text.secondary', fontSize: 10, fontWeight: labelFontWeight }
}

export function getTypographyStyles3({
  valueFontWeight,
}: {
  valueFontWeight: number
}): SxProps<Theme> {
  return {
    fontSize: 12,
    fontWeight: valueFontWeight,
    lineHeight: 1.25,
    mt: 0.25,
  }
}
