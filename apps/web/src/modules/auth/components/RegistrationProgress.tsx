import { Box, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'

import { brand, motion, radius } from '@shared/theme/tokens'

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

        return (
          <Box
            key={index}
            sx={{
              width: isCurrentStep ? 32 : 8,
              height: 8,
              borderRadius: `${radius.full}px`,
              bgcolor: isCurrentStep ? brand.magenta[500] : brand.neutral[100],
              transition: motion.transition.progressStep,
              '@media (prefers-reduced-motion: reduce)': {
                transition: 'none',
              },
            }}
          />
        )
      })}
    </Stack>
  )
}
