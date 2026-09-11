'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Divider, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface, zIndex } from '@shared/theme/tokens'

import { createPropertySteps } from '../config/dashboard-property-ui'
import {
  createDashboardPropertyDefaultValues,
  createDashboardPropertySchema,
} from '../schemas/create-dashboard-property-schema'
import type { CreateDashboardPropertyFormValues } from '../types/dashboard-property'
import { CreatePropertyActions } from './CreatePropertyActions'
import { CreatePropertyStepFields } from './CreatePropertyStepFields'
import { CreatePropertyStepsNav } from './CreatePropertyStepsNav'

const mobileDashboardHeaderHeight = 64
const mobileCreateHeaderHeight = 104
const mobileActionsHeight = 78
const mobileContentGap = 24

export function CreatePropertyDashboardPage() {
  const t = useTranslations('properties.create')
  const { control, handleSubmit, setValue, watch } = useForm<CreateDashboardPropertyFormValues>({
    defaultValues: createDashboardPropertyDefaultValues,
    resolver: zodResolver(createDashboardPropertySchema),
  })
  const activeStepIndex = watch('activeStepIndex')
  const maxVisitedStepIndex = watch('maxVisitedStepIndex')
  const propertyPurpose = watch('purpose')
  const activeStep = createPropertySteps[activeStepIndex]
  const firstStep = activeStepIndex === 0
  const lastStep = activeStepIndex === createPropertySteps.length - 1

  useEffect(() => {
    if (!window.matchMedia('(max-width: 899px)').matches) return

    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeStepIndex])

  const goToPreviousStep = () => {
    setValue('activeStepIndex', Math.max(activeStepIndex - 1, 0))
  }

  const goToNextStep = () => {
    const nextStepIndex = Math.min(activeStepIndex + 1, createPropertySteps.length - 1)

    setValue('activeStepIndex', nextStepIndex)
    setValue('maxVisitedStepIndex', Math.max(maxVisitedStepIndex, nextStepIndex))
  }

  const handleStaticSubmit = () => undefined

  return (
    <Box
      sx={{
        width: '100%',
        px: { xs: 1.6, md: 4.8 },
        pt: { xs: `${mobileCreateHeaderHeight}px`, md: 4.2 },
        pb: { xs: 10.5, md: 4.2 },
      }}
    >
      <Box sx={{ width: '100%', maxWidth: { xs: 440, md: 'none' }, mx: { xs: 'auto', md: 0 } }}>
        <Box
          sx={{
            position: { xs: 'fixed', md: 'static' },
            top: { xs: mobileDashboardHeaderHeight, md: 'auto' },
            right: { xs: 0, md: 'auto' },
            left: { xs: 0, md: 'auto' },
            zIndex: { xs: zIndex.content, md: 'auto' },
            height: { xs: mobileCreateHeaderHeight, md: 'auto' },
            minHeight: { xs: mobileCreateHeaderHeight, md: 'auto' },
            maxHeight: { xs: mobileCreateHeaderHeight, md: 'none' },
            bgcolor: { xs: surface.app, md: 'transparent' },
            px: { xs: 1.6, md: 0 },
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              justifyItems: { xs: 'center', md: 'stretch' },
              alignContent: { xs: 'center', md: 'initial' },
              gap: { xs: 1.2, md: 0 },
              width: '100%',
              maxWidth: { xs: 440, md: 'none' },
              height: { xs: '100%', md: 'auto' },
              mx: { xs: 'auto', md: 0 },
              transform: { xs: 'translateY(8px)', md: 'none' },
            }}
          >
            <Typography
              variant="h3"
              sx={{
                color: brand.graphite[500],
                fontSize: { xs: 20, md: 36 },
                fontWeight: 900,
                mb: { xs: 0, md: 3 },
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                {t('title')}
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
                {t('mobileTitle')}
              </Box>
            </Typography>

            <CreatePropertyStepsNav
              activeStepIndex={activeStepIndex}
              maxVisitedStepIndex={maxVisitedStepIndex}
              onStepSelect={(stepIndex) => setValue('activeStepIndex', stepIndex)}
            />
          </Box>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit(handleStaticSubmit)}
          sx={{
            bgcolor: surface.paper,
            border: '1px solid',
            borderColor: { xs: alpha.graphite[6], md: alpha.graphite[8] },
            borderRadius: `${radius.sm}px`,
            boxShadow: { xs: shadows.crmCardCompact, md: shadows.propertyCard },
            height: {
              xs: `calc(100dvh - ${mobileDashboardHeaderHeight + mobileCreateHeaderHeight + mobileActionsHeight + mobileContentGap}px)`,
              md: 'auto',
            },
            minHeight: { xs: 0, md: 'auto' },
            overflowY: { xs: 'auto', md: 'visible' },
            px: { xs: 1.8, md: 3.2 },
            py: { xs: 2, md: 3 },
          }}
        >
          <CreatePropertyStepFields
            control={control}
            activeStepKey={activeStep.key}
            activeStepLabel={t(`steps.${activeStep.key}`)}
            propertyPurpose={propertyPurpose}
          />

          <Divider sx={{ display: { xs: 'none', md: 'block' }, my: 2.6 }} />

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
