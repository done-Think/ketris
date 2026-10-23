import type { ReactNode } from 'react'
import type { SxProps, Theme } from '@mui/material/styles'

export type AuthFormFieldProps = {
  children: ReactNode
  htmlFor: string
  label: string
  labelSx?: SxProps<Theme>
  required?: boolean
}
