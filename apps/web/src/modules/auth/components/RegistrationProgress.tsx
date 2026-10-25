import { getStyles } from '../styles/registration-progress.styles'
import { Box, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { RegistrationProgressProps } from '../types/registration'

export function RegistrationProgress({ currentStep, totalSteps }: RegistrationProgressProps) {
  const t = useTranslations('auth.register.progress')

  return (
    <Stack
      aria-label={t('label', { currentStep, totalSteps })}
      aria-valuemax={totalSteps}
      aria-valuemin={1}
      aria-valuenow={currentStep}
      direction="row"
      role="progressbar"
      spacing={1}
    >
      {Array.from({ length: totalSteps }, (_, index) => {
        const isCurrentStep = index === currentStep - 1
        const styles = getStyles(isCurrentStep)

        return <Box key={index} sx={styles.box} />
      })}
    </Stack>
  )
}
