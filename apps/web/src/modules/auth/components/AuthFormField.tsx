import { Box, Typography } from '@mui/material'

import type { AuthFormFieldProps } from '../types/auth-shell'

export function AuthFormField({
  children,
  htmlFor,
  label,
  labelSx,
  required = false,
}: AuthFormFieldProps) {
  return (
    <Box>
      <Typography
        component="label"
        htmlFor={htmlFor}
        variant="body2"
        sx={[
          { display: 'inline-block', mb: 0.75, color: 'text.primary', fontWeight: 500 },
          ...(Array.isArray(labelSx) ? labelSx : [labelSx]),
        ]}
      >
        {label}
        {required && (
          <Box component="span" sx={{ ml: 0.5, color: 'primary.main' }}>
            *
          </Box>
        )}
      </Typography>

      {children}
    </Box>
  )
}
