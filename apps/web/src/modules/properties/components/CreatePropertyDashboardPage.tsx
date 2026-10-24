'use client'

import { useSession } from 'next-auth/react'

import { styles } from '../styles/create-property-dashboard-page.styles'

import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Divider } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { useRouter } from '@/i18n/navigation'

import { usePropertyFormWizard } from '../hooks/use-property-form-wizard'
import { useCreateProperty, usePropertyMediaUploadsPending } from '../hooks/use-properties'
import {
  createDashboardPropertyDefaultValues,
  createDashboardPropertySchema,
} from '../schemas/create-dashboard-property-schema'
import type { CreateDashboardPropertyFormValues } from '../types/dashboard-property'
import { extractErrorMessage } from '@shared/utils/error-message'
import { toPropertyPayload } from '../utils/to-property-payload'
import { CreatePropertyActions } from './CreatePropertyActions'
import { CreatePropertyStepFields } from './CreatePropertyStepFields'
import { PropertyFormLayout } from './PropertyFormLayout'

export function CreatePropertyDashboardPage() {
  const t = useTranslations('properties.create')
  const { enqueueSnackbar } = useSnackbar()
  const router = useRouter()
  const { data: session } = useSession()
  const canChooseOwner = session?.role === 'OWNER' || session?.role === 'AGENT'
  const createProperty = useCreateProperty()
  const isUploading = usePropertyMediaUploadsPending()
  const propertySchema = useMemo(
    () => createDashboardPropertySchema((key) => t(`errors.${key}`)),
    [t],
  )
  const { control, handleSubmit, trigger, setValue } = useForm<CreateDashboardPropertyFormValues>({
    defaultValues: createDashboardPropertyDefaultValues,
    resolver: zodResolver(propertySchema),
  })
  const wizard = usePropertyFormWizard({ trigger, isUploading })
  const {
    activeStepIndex,
    maxVisitedStepIndex,
    activeStep,
    firstStep,
    lastStep,
    goToPreviousStep,
    goToNextStep,
  } = wizard
  const propertyPurpose = useWatch({ control, name: 'purpose' })

  const handleCreateSubmit = async (values: CreateDashboardPropertyFormValues) => {
    if (isUploading) return
    try {
      const property = await createProperty.mutateAsync(
        toPropertyPayload(values, { canChooseOwner }),
      )
      enqueueSnackbar(t('createSuccess'), { variant: 'success' })
      router.push({ pathname: '/dashboard/properties/[id]', params: { id: property.id } })
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('createError')), { variant: 'error' })
    }
  }

  return (
    <PropertyFormLayout
      title={t('title')}
      mobileTitle={t('mobileTitle')}
      activeStepIndex={activeStepIndex}
      maxVisitedStepIndex={maxVisitedStepIndex}
      isUploading={isUploading}
      onStepSelect={wizard.selectStep}
      onSubmit={handleSubmit(handleCreateSubmit, wizard.showErrors)}
    >
      <CreatePropertyStepFields
        onAddressChange={() => {
          setValue('latitude', null, { shouldDirty: true })
          setValue('longitude', null, { shouldDirty: true })
        }}
        control={control}
        activeStepKey={activeStep.key}
        activeStepLabel={t(`steps.${activeStep.key}`)}
        propertyPurpose={propertyPurpose}
      />

      <Divider sx={styles.divider} />

      <CreatePropertyActions
        firstStep={firstStep}
        lastStep={lastStep}
        isSubmitting={createProperty.isPending}
        isUploading={isUploading}
        onPreviousStep={goToPreviousStep}
        onNextStep={goToNextStep}
        submitLabel={t('saveDraft')}
      />
    </PropertyFormLayout>
  )
}
