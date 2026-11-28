'use client'

import { useSession } from 'next-auth/react'
import { useRef, useState } from 'react'

import { styles } from '../styles/create-property-dashboard-page.styles'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Divider } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { useRouter } from '@/i18n/navigation'

import { instagramService } from '@shared/lib/api/instagram-service'
import { createPropertyPublishingOptions } from '../config/dashboard-property-ui'

import { usePropertyFormWizard } from '../hooks/use-property-form-wizard'
import {
  useCreateProperty,
  usePropertyMediaUploadsPending,
  usePublishProperty,
} from '../hooks/use-properties'
import { useDashboardPropertySchema } from '../hooks/use-dashboard-property-schema'
import { createDashboardPropertyDefaultValues } from '../schemas/create-dashboard-property-schema'
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
  const publishProperty = usePublishProperty()
  const instagramT = useTranslations('properties.instagram')
  const [submitting, setSubmitting] = useState(false)
  const propertySchema = useDashboardPropertySchema()
  const { control, handleSubmit, trigger, setValue, getValues } =
    useForm<CreateDashboardPropertyFormValues>({
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
  const publishingOptions = useWatch({ control, name: 'publishingOptions' })
  // The ref blocks a second submit at once; the state only drives the button. Both stay set
  // after success, so the button cannot create a second property before the redirect.
  const submitPending = useRef(false)

  const handleCreateSubmit = async (values: CreateDashboardPropertyFormValues) => {
    if (isUploading || submitPending.current) return
    submitPending.current = true
    setSubmitting(true)
    try {
      const property = await createProperty.mutateAsync(
        toPropertyPayload(values, { canChooseOwner, canManageBrokers: session?.role === 'OWNER' }),
      )
      if (values.publishingOptions.includes(createPropertyPublishingOptions[0])) {
        try {
          await publishProperty.mutateAsync(property.id)
        } catch {
          enqueueSnackbar(instagramT('sitePublishFailed'), { variant: 'warning' })
          router.push({ pathname: '/dashboard/properties/[id]', params: { id: property.id } })
          return
        }
        if (values.instagramEnabled) {
          try {
            await instagramService.queue(property.id, {
              caption: values.instagramCaption,
              imageUrls: values.instagramImageUrls,
            })
            enqueueSnackbar(instagramT('queued'), { variant: 'info' })
          } catch {
            enqueueSnackbar(instagramT('sitePublishedInstagramFailed'), { variant: 'warning' })
          }
        }
      }
      enqueueSnackbar(t('createSuccess'), { variant: 'success' })
      if (
        property.address &&
        (property.address.latitude === null || property.address.longitude === null)
      )
        enqueueSnackbar(t('addressLocationUnavailable'), { variant: 'warning' })
      router.push({ pathname: '/dashboard/properties/[id]', params: { id: property.id } })
    } catch (error) {
      submitPending.current = false
      setSubmitting(false)
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
      onSubmit={(event) => handleSubmit(handleCreateSubmit, wizard.showErrors)(event)}
    >
      <CreatePropertyStepFields
        getValues={getValues}
        setValue={setValue}
        control={control}
        activeStepKey={activeStep.key}
        activeStepLabel={t(`steps.${activeStep.key}`)}
        propertyPurpose={propertyPurpose}
      />

      <Divider sx={styles.divider} />

      <CreatePropertyActions
        firstStep={firstStep}
        lastStep={lastStep}
        isSubmitting={submitting}
        isUploading={isUploading}
        onPreviousStep={goToPreviousStep}
        onNextStep={goToNextStep}
        submitLabel={
          publishingOptions.includes(createPropertyPublishingOptions[0])
            ? t('publish')
            : t('saveDraft')
        }
      />
    </PropertyFormLayout>
  )
}
