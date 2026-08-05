import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'

type AuthFormFieldProps = {
  children: ReactNode
  htmlFor: string
  label: string
}

export function AuthFormField({ children, htmlFor, label }: AuthFormFieldProps) {
  return (
    <Box>
      <Typography
        component="label"
        htmlFor={htmlFor}
        variant="body2"
        sx={{ display: 'inline-block', mb: 0.75, color: 'text.primary', fontWeight: 500 }}
      >
        {label}
      </Typography>

      {children}
    </Box>
  )
}
