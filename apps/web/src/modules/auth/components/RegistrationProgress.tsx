import { Box, Stack } from '@mui/material'

import { brand, radius } from '@shared/theme/tokens'

type RegistrationProgressProps = {
  currentStep: number
  totalSteps: number
}

export function RegistrationProgress({ currentStep, totalSteps }: RegistrationProgressProps) {
  return (
    <Stack
      aria-label={`Etapa ${currentStep} de ${totalSteps}`}
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
              transition: 'width 160ms ease, background-color 160ms ease',
            }}
          />
        )
      })}
    </Stack>
  )
}
