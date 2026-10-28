'use client'

import * as crmStyles from '../styles/create-lead-dialog.styles'

import { zodResolver } from '@hookform/resolvers/zod'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { Fragment, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { createLeadSteps } from '../config/lead-creation'
import { useLeadWizard } from '../hooks/use-lead-wizard'
import { useCreateLead } from '../hooks/use-leads'
import { createLeadDefaultValues, createLeadSchema } from '../schemas/create-lead-schema'
import type { CreateLeadDialogProps, CreateLeadFormValues } from '../types/lead'
import { extractErrorMessage } from '@shared/utils/error-message'
import { CreateLeadContactStep } from './create-lead-dialog/CreateLeadContactStep'
import { CreateLeadInterestStep } from './create-lead-dialog/CreateLeadInterestStep'
import { CreateLeadReviewStep } from './create-lead-dialog/CreateLeadReviewStep'

function getNextStepIndex(activeStepIndex: number) {
  return Math.min(activeStepIndex + 1, createLeadSteps.length - 1)
}

export function CreateLeadDialog(props: CreateLeadDialogProps) {
  return props.open ? <CreateLeadForm {...props} /> : null
}

function CreateLeadForm({ onClose, open }: CreateLeadDialogProps) {
  const t = useTranslations('crm.leads')
  const { enqueueSnackbar } = useSnackbar()
  const createLead = useCreateLead()
  const leadSchema = useMemo(() => createLeadSchema((key) => t(`create.errors.${key}`)), [t])
  const { control, handleSubmit, trigger } = useForm<CreateLeadFormValues>({
    defaultValues: createLeadDefaultValues,
    resolver: zodResolver(leadSchema),
  })
  const wizard = useLeadWizard()
  const { activeStepIndex, maxVisitedStepIndex } = wizard
  const formValues = useWatch({ control })
  const activeStep = createLeadSteps[activeStepIndex]
  const isReviewStep = activeStepIndex === createLeadSteps.length - 1

  const handleClose = () => {
    if (!createLead.isPending) onClose()
  }

  const goToStep = (stepIndex: number) => {
    if (stepIndex <= maxVisitedStepIndex) wizard.visit(stepIndex)
  }

  const handleNext = async () => {
    const isStepValid = await trigger(activeStep.fields)

    if (!isStepValid) return

    const nextStepIndex = getNextStepIndex(activeStepIndex)

    wizard.visit(nextStepIndex)
  }

  const handleBack = () => {
    wizard.previous()
  }

  const handleCreateLead = (values: CreateLeadFormValues) => {
    createLead.mutate(
      {
        name: values.name,
        phone: values.phone,
        email: values.email || null,
        interest: values.interest,
        budget: values.budget,
        source: values.source,
        notes: values.notes || null,
      },
      {
        onSuccess: () => {
          enqueueSnackbar(t('create.success'), { variant: 'success' })
          handleClose()
        },
        onError: (error) => {
          enqueueSnackbar(extractErrorMessage(error, t('create.error')), { variant: 'error' })
        },
      },
    )
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <Box
        component="form"
        onSubmit={handleSubmit(handleCreateLead, (errors) => {
          const firstInvalidStep = createLeadSteps.findIndex((step) =>
            step.fields.some((field) => Boolean(errors[field])),
          )
          if (firstInvalidStep >= 0) wizard.visit(firstInvalidStep)
        })}
      >
        <DialogTitle sx={crmStyles.dialogTitleSx}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box sx={crmStyles.boxSx}>
              <Typography sx={crmStyles.typographySx}>{t('create.eyebrow')}</Typography>
              <Typography sx={crmStyles.typographySx2}>{t('create.title')}</Typography>
            </Box>
            <IconButton aria-label={t('create.actions.close')} onClick={handleClose}>
              <CloseRoundedIcon sx={crmStyles.closeRoundedIconSx} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={crmStyles.dialogContentSx}>
          <Stack spacing={2}>
            <Stepper activeStep={activeStepIndex} alternativeLabel sx={crmStyles.stepperSx}>
              {createLeadSteps.map((step, index) => (
                <Step key={step.key} completed={index < maxVisitedStepIndex}>
                  <StepLabel
                    onClick={() => {
                      void goToStep(index)
                    }}
                    sx={crmStyles.getStepLabelSx(index, maxVisitedStepIndex)}
                  >
                    {t(`create.steps.${step.labelKey}`)}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={crmStyles.boxSx2}>
              {activeStep.key === 'contact' ? <CreateLeadContactStep control={control} /> : null}
              {activeStep.key === 'interest' ? <CreateLeadInterestStep control={control} /> : null}
              {activeStep.key === 'review' ? (
                <CreateLeadReviewStep control={control} formValues={formValues} />
              ) : null}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={crmStyles.dialogActionsSx}>
          <Button type="button" variant="outlined" color="secondary" onClick={handleClose}>
            {t('create.actions.cancel')}
          </Button>
          {activeStepIndex > 0 ? (
            <Button type="button" variant="outlined" color="secondary" onClick={handleBack}>
              {t('create.actions.back')}
            </Button>
          ) : null}
          {isReviewStep ? (
            <Fragment key="review-actions">
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddRoundedIcon />}
                disabled={createLead.isPending}
              >
                {t('create.actions.create')}
              </Button>
            </Fragment>
          ) : (
            <Fragment key="step-actions">
              <Button type="button" variant="contained" onClick={handleNext}>
                {t('create.actions.next')}
              </Button>
            </Fragment>
          )}
        </DialogActions>
      </Box>
    </Dialog>
  )
}
