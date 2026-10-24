'use client'

import { useSession } from 'next-auth/react'

import { styles } from '../styles/edit-property-form.styles'

import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Divider } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { useRouter } from '@/i18n/navigation'

import { createPropertySteps } from '../config/dashboard-property-ui'
import { usePropertyFormWizard } from '../hooks/use-property-form-wizard'
import { useUpdateProperty, usePropertyMediaUploadsPending } from '../hooks/use-properties'
import { createDashboardPropertySchema } from '../schemas/create-dashboard-property-schema'
import type {
  CreateDashboardPropertyFormValues,
  EditPropertyFormProps,
} from '../types/dashboard-property'
import { buildEditPropertyFormValues } from '../utils/build-edit-property-form-values'
import { extractErrorMessage } from '@shared/utils/error-message'
import { toPropertyPayload } from '../utils/to-property-payload'
import { CreatePropertyActions } from './CreatePropertyActions'
import { CreatePropertyStepFields } from './CreatePropertyStepFields'
import { PropertyFormLayout } from './PropertyFormLayout'

export function EditPropertyForm({ property }: EditPropertyFormProps) {
  const t = useTranslations('properties.edit')
  const stepsT = useTranslations('properties.create')
  const { enqueueSnackbar } = useSnackbar()
  const router = useRouter()
  const { data: session } = useSession()
  const canChooseOwner = session?.role === 'OWNER' || session?.role === 'AGENT'
  const propertyId = property.id
  const updateProperty = useUpdateProperty(propertyId)
  const isUploading = usePropertyMediaUploadsPending()
  const propertySchema = useMemo(
    () => createDashboardPropertySchema((key) => stepsT(`errors.${key}`)),
    [stepsT],
  )
  const { control, handleSubmit, trigger, setValue } = useForm<CreateDashboardPropertyFormValues>({
    defaultValues: buildEditPropertyFormValues(property),
    resolver: zodResolver(propertySchema),
  })
  const wizard = usePropertyFormWizard({
    trigger,
    isUploading,
    initialMaxVisitedStepIndex: createPropertySteps.length - 1,
  })
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

  const handleEditSubmit = async (values: CreateDashboardPropertyFormValues) => {
    if (isUploading) return
    try {
      await updateProperty.mutateAsync(
        toPropertyPayload(values, { existingAddress: property.address, canChooseOwner }),
      )
      enqueueSnackbar(t('updateSuccess'), { variant: 'success' })
      router.push({ pathname: '/dashboard/properties/[id]', params: { id: propertyId } })
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('updateError')), { variant: 'error' })
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
      onSubmit={handleSubmit(handleEditSubmit, wizard.showErrors)}
    >
      <CreatePropertyStepFields
        onAddressChange={() => {
          setValue('latitude', null, { shouldDirty: true })
          setValue('longitude', null, { shouldDirty: true })
        }}
        control={control}
        activeStepKey={activeStep.key}
        activeStepLabel={stepsT(`steps.${activeStep.key}`)}
        propertyPurpose={propertyPurpose}
      />

      <Divider sx={styles.divider} />

      <CreatePropertyActions
        firstStep={firstStep}
        lastStep={lastStep}
        isSubmitting={updateProperty.isPending}
        isUploading={isUploading}
        onPreviousStep={goToPreviousStep}
        onNextStep={goToNextStep}
        submitLabel={t('save')}
      />
    </PropertyFormLayout>
  )
}
