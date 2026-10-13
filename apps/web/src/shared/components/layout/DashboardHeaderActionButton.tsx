import { Button, type ButtonProps } from '@mui/material'

import { dashboardHeaderActionButtonSx } from './dashboard-header-actions'

export function DashboardHeaderActionButton({
  variant = 'contained',
  type = 'button',
  sx,
  ...props
}: ButtonProps) {
  return (
    <Button
      type={type}
      variant={variant}
      sx={[dashboardHeaderActionButtonSx, ...(Array.isArray(sx) ? sx : [sx])]}
      {...props}
    />
  )
}
