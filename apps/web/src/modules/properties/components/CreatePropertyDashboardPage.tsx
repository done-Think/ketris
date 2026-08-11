'use client'

import { useState } from 'react'
import { Box, Divider, Typography } from '@mui/material'

import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

import { createPropertySteps } from '../config/dashboard-property-ui'
import type { CreatePropertyPurpose } from '../types/dashboard-property'
import { CreatePropertyActions } from './CreatePropertyActions'
import { CreatePropertyStepFields } from './CreatePropertyStepFields'
import { CreatePropertyStepsNav } from './CreatePropertyStepsNav'

export function CreatePropertyDashboardPage() {
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [propertyPurpose, setPropertyPurpose] = useState<CreatePropertyPurpose>('Aluguel')
  const activeStep = createPropertySteps[activeStepIndex]
  const firstStep = activeStepIndex === 0
  const lastStep = activeStepIndex === createPropertySteps.length - 1

  const goToPreviousStep = () => {
    setActiveStepIndex((current) => Math.max(current - 1, 0))
  }

  const goToNextStep = () => {
    setActiveStepIndex((current) => Math.min(current + 1, createPropertySteps.length - 1))
  }

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 4.8 }, py: { xs: 2.8, md: 4.2 } }}>
      <Box sx={{ width: '100%', maxWidth: 1180 }}>
        <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 900, mb: 3 }}>
          Cadastrar Imóvel
        </Typography>

        <CreatePropertyStepsNav
          activeStepIndex={activeStepIndex}
          onStepSelect={setActiveStepIndex}
        />

        <Box
          component="form"
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
            propertyPurpose={propertyPurpose}
            onPropertyPurposeChange={setPropertyPurpose}
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
