import type { TypographyProps } from '@mui/material'

export type OverflowTooltipTextProps = Pick<
  TypographyProps,
  'sx' | 'variant' | 'color' | 'className'
> & {
  children: string
}
