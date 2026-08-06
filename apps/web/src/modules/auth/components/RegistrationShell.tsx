import type { ReactNode } from 'react'
import { Box } from '@mui/material'

import { AppLogo } from '@shared/components/ui'
import { surface } from '@shared/theme/tokens'

import { RegistrationProgress } from './RegistrationProgress'
import { registrationFontFamily } from './registration.styles'

type RegistrationShellProps = {
  children: ReactNode
  currentStep: number
  totalSteps: number
}

export function RegistrationShell({ children, currentStep, totalSteps }: RegistrationShellProps) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100dvh',
        bgcolor: surface.app,
        fontFamily: registrationFontFamily.body,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 832,
          minHeight: '100dvh',
          mx: 'auto',
          px: { xs: 2.5, sm: 4 },
          pt: { xs: 2.5, sm: 4 },
          pb: { xs: 3, sm: 6 },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          component="header"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <AppLogo src="/ketris-logo-transparent.png" width={{ xs: 92, sm: 108 }} />
          <RegistrationProgress currentStep={currentStep} totalSteps={totalSteps} />
        </Box>

        {children}
      </Box>
    </Box>
  )
}
