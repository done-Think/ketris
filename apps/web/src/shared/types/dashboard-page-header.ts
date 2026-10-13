import type { ReactNode } from 'react'
import type { SxProps, Theme } from '@mui/material'

export type DashboardPageHeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  sx?: SxProps<Theme>
}
