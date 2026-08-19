import type { ReactNode } from 'react'
import type { SxProps, Theme } from '@mui/material/styles'

export type AuthMobileVariant = 'plain' | 'card' | 'backdrop'

export type AuthMobileLayout = {
  pageBackground: string
  pageRows: string
  mainZIndex: number | 'auto'
  mainMinHeight: string
  mainPaddingX: number
  mainPaddingXSm: number
  mainPaddingTop: number
  mainPaddingTopSm: number
  mainPaddingBottom: number
  mainBackground: string
  cardPaddingX: number
  cardPaddingTop: number
  cardPaddingBottom: number
  cardRadius: string | number
  cardBackground: string
  cardShadow: string
  footerBottom: number
}

export type AuthShellProps = {
  brandDescription?: string
  children: ReactNode
  contentMaxWidth?: number
  contentPaddingTop?: number
  footer?: ReactNode
  mobileVariant?: AuthMobileVariant
}

export type AuthBrandPanelProps = {
  description?: string
  mobileBackdrop?: boolean
}

export type AuthFormFieldProps = {
  children: ReactNode
  htmlFor: string
  label: string
  labelSx?: SxProps<Theme>
  required?: boolean
}
