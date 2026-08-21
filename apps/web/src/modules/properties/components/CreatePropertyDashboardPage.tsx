'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Divider, Typography } from '@mui/material'

import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

import { createPropertySteps } from '../config/dashboard-property-ui'
import {
  createDashboardPropertyDefaultValues,
  createDashboardPropertySchema,
} from '../schemas/create-dashboard-property-schema'
import type { CreateDashboardPropertyFormValues } from '../types/dashboard-property'
import { CreatePropertyActions } from './CreatePropertyActions'
import { CreatePropertyStepFields } from './CreatePropertyStepFields'
import { CreatePropertyStepsNav } from './CreatePropertyStepsNav'

export function CreatePropertyDashboardPage() {
  const { control, handleSubmit, setValue, watch } = useForm<CreateDashboardPropertyFormValues>({
    defaultValues: createDashboardPropertyDefaultValues,
    resolver: zodResolver(createDashboardPropertySchema),
  })
  const activeStepIndex = watch('activeStepIndex')
  const propertyPurpose = watch('purpose')
  const activeStep = createPropertySteps[activeStepIndex]
  const firstStep = activeStepIndex === 0
  const lastStep = activeStepIndex === createPropertySteps.length - 1

  const goToPreviousStep = () => {
    setValue('activeStepIndex', Math.max(activeStepIndex - 1, 0))
  }

  const goToNextStep = () => {
    setValue('activeStepIndex', Math.min(activeStepIndex + 1, createPropertySteps.length - 1))
  }

  const handleStaticSubmit = () => undefined

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 4.8 }, py: { xs: 2.8, md: 4.2 } }}>
      <Box sx={{ width: '100%', maxWidth: 1180 }}>
        <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 900, mb: 3 }}>
          Cadastrar imóvel
        </Typography>

        <CreatePropertyStepsNav
          activeStepIndex={activeStepIndex}
          onStepSelect={(stepIndex) => setValue('activeStepIndex', stepIndex)}
        />

        <Box
          component="form"
          onSubmit={handleSubmit(handleStaticSubmit)}
          sx={{
            bgcolor: surface.paper,
            border: '1px solid',
            borderColor: alpha.graphite[8],
            borderRadius: `${radius.sm}px`,
            boxShadow: shadows.propertyCard,
            px: { xs: 2, md: 3.2 },
            py: { xs: 2.4, md: 3 },
          }}
        >
          <CreatePropertyStepFields
            control={control}
            activeStepKey={activeStep.key}
            activeStepLabel={activeStep.label}
            propertyPurpose={propertyPurpose}
            onPropertyPurposeChange={(purpose) => setValue('purpose', purpose)}
          />

          <Divider sx={{ my: 2.6 }} />

          <CreatePropertyActions
            firstStep={firstStep}
            lastStep={lastStep}
            onPreviousStep={goToPreviousStep}
            onNextStep={goToNextStep}
          />
        </Box>
      </Box>
    </Box>
  )
}
