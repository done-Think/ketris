import type { SxProps, Theme } from '@mui/material/styles'
import type { StaticImageData } from 'next/image'

export type AppLogoProps = {
  src: string | StaticImageData
  variant?: 'solid' | 'transparent'
  width: { xs?: number; sm?: number; md?: number } | number
  marginBottom?: { xs?: number; md?: number } | number
  sx?: SxProps<Theme>
}
