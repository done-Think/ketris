import type { ReactNode } from 'react'
import type { ButtonProps } from '@mui/material'

export type DashboardStatusFilterButtonProps = {
  active: boolean
  count: number
  children: ReactNode
  onClick: () => void
  sx?: ButtonProps['sx']
}
