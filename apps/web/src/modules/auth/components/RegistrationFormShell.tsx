import { styles } from '../styles/registration-form-shell.styles'
import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { RegistrationBenefitsPanel } from './RegistrationBenefitsPanel'
import { RegistrationProgress } from './RegistrationProgress'

import type { RegistrationFormShellProps } from '../types/registration'

export function RegistrationFormShell({
  children,
  currentStep,
  title,
  totalSteps,
}: RegistrationFormShellProps) {
  const t = useTranslations('auth.register.progress')

  return (
    <Box sx={styles.box}>
      <RegistrationBenefitsPanel />

      <Box component="main" sx={styles.box2}>
        <Box sx={styles.box3}>
          <Box sx={styles.box4}>
            <Typography variant="overline" sx={styles.typography}>
              {t('shortLabel', { currentStep, totalSteps })}
            </Typography>
            <RegistrationProgress currentStep={currentStep} totalSteps={totalSteps} />
          </Box>

          <Typography component="h1" variant="h2" sx={styles.typography2}>
            {title}
          </Typography>

          {children}
        </Box>
      </Box>
    </Box>
  )
}
