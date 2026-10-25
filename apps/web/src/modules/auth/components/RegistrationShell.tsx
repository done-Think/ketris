import { styles } from '../styles/registration-shell.styles'
import { Box } from '@mui/material'

import ketrisLogoTransparent from '@shared/assets/ketris-logo-transparent.png'
import { AppLogo } from '@shared/components/ui'

import { RegistrationProgress } from './RegistrationProgress'

import type { RegistrationShellProps } from '../types/registration'

export function RegistrationShell({ children, currentStep, totalSteps }: RegistrationShellProps) {
  return (
    <Box component="main" sx={styles.box}>
      <Box sx={styles.box2}>
        <Box component="header" sx={styles.box3}>
          <AppLogo src={ketrisLogoTransparent} variant="transparent" width={{ xs: 92, sm: 108 }} />
          <RegistrationProgress currentStep={currentStep} totalSteps={totalSteps} />
        </Box>

        {children}
      </Box>
    </Box>
  )
}
