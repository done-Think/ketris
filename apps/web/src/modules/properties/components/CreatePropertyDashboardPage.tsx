'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Divider, Typography } from '@mui/material'
import { useForm, useWatch } from 'react-hook-form'

import { alpha, componentText, radius, shadows, surface } from '@shared/theme/tokens'

import { createPropertySteps } from '../config/dashboard-property-ui'
import {
  createPropertySchema,
  createPropertyStepFields,
  type CreatePropertyFormValues,
} from '../schemas/create-property-schema'
import { CreatePropertyActions } from './CreatePropertyActions'
import { CreatePropertyStepFields } from './CreatePropertyStepFields'
import { CreatePropertyStepsNav } from './CreatePropertyStepsNav'

export function CreatePropertyDashboardPage() {
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const {
    control,
    handleSubmit,
    trigger,
    formState: { isSubmitting },
  } = useForm<CreatePropertyFormValues>({
    resolver: zodResolver(createPropertySchema),
    mode: 'onTouched',
    defaultValues: {
      type: 'Apartamento',
      purpose: 'Aluguel',
      title: '',
      description: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      features: [],
      warranty: '',
      publishing: [],
    },
  })
  const propertyPurpose = useWatch({ control, name: 'purpose' })
  const activeStep = createPropertySteps[activeStepIndex]
  const firstStep = activeStepIndex === 0
  const lastStep = activeStepIndex === createPropertySteps.length - 1

  const goToPreviousStep = () => {
    setActiveStepIndex((current) => Math.max(current - 1, 0))
  }

  const goToNextStep = async () => {
    const stepFields = createPropertyStepFields[activeStep.key]
    const stepIsValid = stepFields.length === 0 || (await trigger([...stepFields]))

    if (!stepIsValid) return

    setActiveStepIndex((current) => Math.min(current + 1, createPropertySteps.length - 1))
  }

  const publishProperty = () => {}

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 4.8 }, py: { xs: 2.8, md: 4.2 } }}>
      <Box sx={{ width: '100%', maxWidth: 1180 }}>
        <Typography variant="h3" sx={{ ...componentText.dashboardPageTitle, mb: 3 }}>
          Cadastrar Imóvel
        </Typography>

        <CreatePropertyStepsNav
          activeStepIndex={activeStepIndex}
          onStepSelect={setActiveStepIndex}
        />

        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(publishProperty)}
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
            activeStepKey={activeStep.key}
            activeStepLabel={activeStep.label}
            control={control}
            propertyPurpose={propertyPurpose}
          />

          <Divider sx={{ my: 2.6 }} />

          <CreatePropertyActions
            firstStep={firstStep}
            lastStep={lastStep}
            isSubmitting={isSubmitting}
            onPreviousStep={goToPreviousStep}
            onNextStep={goToNextStep}
          />
        </Box>
      </Box>
    </Box>
  )
}
