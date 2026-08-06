import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'

import { surface } from '@shared/theme/tokens'

import { RegistrationBenefitsPanel } from './RegistrationBenefitsPanel'
import { RegistrationProgress } from './RegistrationProgress'
import { registrationFontFamily } from './registration.styles'

type RegistrationFormShellProps = {
  children: ReactNode
  currentStep: number
  title: string
  totalSteps: number
}

export function RegistrationFormShell({
  children,
  currentStep,
  title,
  totalSteps,
}: RegistrationFormShellProps) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(390px, 39.8%) minmax(0, 60.2%)' },
        gridTemplateRows: { xs: 'auto 1fr', md: '1fr' },
        bgcolor: surface.paper,
      }}
    >
      <RegistrationBenefitsPanel />

      <Box
        component="main"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          px: { xs: 2.5, sm: 5, lg: 7 },
          pt: { xs: 4, md: 10 },
          pb: { xs: 5, md: 7 },
          bgcolor: surface.paper,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 550 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontFamily: registrationFontFamily.body }}
            >
              Passo {currentStep} de {totalSteps}
            </Typography>
            <RegistrationProgress currentStep={currentStep} totalSteps={totalSteps} />
          </Box>

          <Typography
            component="h1"
            variant="h2"
            sx={{ mt: 0.75, fontFamily: registrationFontFamily.heading }}
          >
            {title}
          </Typography>

          {children}
        </Box>
      </Box>
    </Box>
  )
}
