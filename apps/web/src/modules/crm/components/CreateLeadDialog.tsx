'use client'

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
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useSnackbar } from 'notistack'

import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

import { createLeadSteps, leadSourceOptions, leadStageOptions } from '../config/lead-creation'
import { createLeadDefaultValues, createLeadSchema } from '../schemas/create-lead-schema'
import { useLeadsStore } from '../stores/leads-store'
import type { CreateLeadDialogProps, CreateLeadFormValues } from '../types/lead'

const phoneMask = [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]

function getNextStepIndex(activeStepIndex: number) {
  return Math.min(activeStepIndex + 1, createLeadSteps.length - 1)
}

function getPreviousStepIndex(activeStepIndex: number) {
  return Math.max(activeStepIndex - 1, 0)
}

export function CreateLeadDialog({ onClose, open }: CreateLeadDialogProps) {
  const t = useTranslations('crm.leads')
  const { enqueueSnackbar } = useSnackbar()
  const addLead = useLeadsStore((state) => state.addLead)
  const { control, handleSubmit, reset, setValue, trigger } = useForm<CreateLeadFormValues>({
    defaultValues: createLeadDefaultValues,
    resolver: zodResolver(createLeadSchema),
  })
  const activeStepIndex = useWatch({ control, name: 'activeStepIndex' })
  const maxVisitedStepIndex = useWatch({ control, name: 'maxVisitedStepIndex' })
  const formValues = useWatch({ control })
  const activeStep = createLeadSteps[activeStepIndex]
  const isReviewStep = activeStepIndex === createLeadSteps.length - 1

  useEffect(() => {
    if (!open) return

    reset(createLeadDefaultValues)
  }, [open, reset])

  const handleClose = () => {
    reset(createLeadDefaultValues)
    onClose()
  }

  const goToStep = async (stepIndex: number) => {
    if (stepIndex <= activeStepIndex || stepIndex <= maxVisitedStepIndex) {
      setValue('activeStepIndex', stepIndex)
      return
    }

    const isStepValid = await trigger(activeStep.fields)

    if (!isStepValid) return

    setValue('activeStepIndex', stepIndex)
    setValue('maxVisitedStepIndex', Math.max(maxVisitedStepIndex, stepIndex))
  }

  const handleNext = async () => {
    const isStepValid = await trigger(activeStep.fields)

    if (!isStepValid) return

    const nextStepIndex = getNextStepIndex(activeStepIndex)

    setValue('activeStepIndex', nextStepIndex)
    setValue('maxVisitedStepIndex', Math.max(maxVisitedStepIndex, nextStepIndex))
  }

  const handleBack = () => {
    setValue('activeStepIndex', getPreviousStepIndex(activeStepIndex))
  }

  const handleCreateLead = (values: CreateLeadFormValues) => {
    addLead(values, t('createdNow'))
    enqueueSnackbar(t('create.success'), { variant: 'success' })
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <Box component="form" onSubmit={handleSubmit(handleCreateLead)}>
        <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: brand.magenta[600], fontSize: 13, fontWeight: 900 }}>
                {t('create.eyebrow')}
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 24, fontWeight: 900 }}>
                {t('create.title')}
              </Typography>
            </Box>
            <IconButton aria-label={t('create.actions.close')} onClick={handleClose}>
              <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2 }}>
          <Stack spacing={2}>
            <Stepper activeStep={activeStepIndex} alternativeLabel sx={{ px: { xs: 0, md: 2 } }}>
              {createLeadSteps.map((step, index) => (
                <Step key={step.key} completed={index < maxVisitedStepIndex}>
                  <StepLabel
                    onClick={() => {
                      void goToStep(index)
                    }}
                    sx={{
                      cursor: index <= maxVisitedStepIndex ? 'pointer' : 'default',
                      '& .MuiStepLabel-label': {
                        color:
                          index <= maxVisitedStepIndex ? brand.magenta[700] : brand.neutral[500],
                        fontSize: 12,
                        fontWeight: 900,
                      },
                    }}
                  >
                    {t(`create.steps.${step.labelKey}`)}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box
              sx={{
                border: '1px solid',
                borderColor: alpha.graphite[8],
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.app,
                p: { xs: 1.6, md: 2 },
              }}
            >
              {activeStep.key === 'contact' ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 1.4,
                  }}
                >
                  <RhfTextField control={control} name="name" label={t('create.fields.name')} />
                  <RhfMaskedTextField
                    control={control}
                    name="phone"
                    label={t('create.fields.phone')}
                    mask={phoneMask}
                  />
                  <RhfTextField
                    control={control}
                    name="email"
                    label={t('create.fields.email')}
                    type="email"
                    sx={{ gridColumn: { md: '1 / -1' } }}
                  />
                </Box>
              ) : null}

              {activeStep.key === 'interest' ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 1.4,
                  }}
                >
                  <RhfTextField
                    control={control}
                    name="interest"
                    label={t('create.fields.interest')}
                  />
                  <RhfTextField control={control} name="budget" label={t('create.fields.budget')} />
                  <RhfTextField
                    control={control}
                    name="source"
                    label={t('create.fields.source')}
                    select
                  >
                    {leadSourceOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {t(`create.sources.${option.labelKey}`)}
                      </MenuItem>
                    ))}
                  </RhfTextField>
                  <RhfTextField control={control} name="broker" label={t('create.fields.broker')} />
                  <RhfTextField
                    control={control}
                    name="stage"
                    label={t('create.fields.stage')}
                    select
                    sx={{ gridColumn: { md: '1 / -1' } }}
                  >
                    {leadStageOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {t(`filters.${option.labelKey}`)}
                      </MenuItem>
                    ))}
                  </RhfTextField>
                </Box>
              ) : null}

              {activeStep.key === 'review' ? (
                <Stack spacing={1.6}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
                      gap: 1.2,
                    }}
                  >
                    {[
                      ['name', formValues.name],
                      ['phone', formValues.phone],
                      ['interest', formValues.interest],
                      ['budget', formValues.budget],
                      ['source', formValues.source],
                      ['broker', formValues.broker],
                      ['stage', formValues.stage],
                    ].map(([fieldKey, value]) => (
                      <Box
                        key={fieldKey}
                        sx={{
                          border: '1px solid',
                          borderColor: alpha.graphite[8],
                          borderRadius: `${radius.sm}px`,
                          bgcolor: surface.paper,
                          p: 1.2,
                        }}
                      >
                        <Typography
                          sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 800 }}
                        >
                          {t(`create.fields.${fieldKey}`)}
                        </Typography>
                        <Typography
                          sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}
                        >
                          {value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <RhfTextField
                    control={control}
                    name="notes"
                    label={t('create.fields.notes')}
                    multiline
                    minRows={3}
                    fullWidth
                  />
                </Stack>
              ) : null}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }}>
          <Button type="button" variant="outlined" color="secondary" onClick={handleClose}>
            {t('create.actions.cancel')}
          </Button>
          {activeStepIndex > 0 ? (
            <Button type="button" variant="outlined" color="secondary" onClick={handleBack}>
              {t('create.actions.back')}
            </Button>
          ) : null}
          {isReviewStep ? (
            <Button type="submit" variant="contained" startIcon={<AddRoundedIcon />}>
              {t('create.actions.create')}
            </Button>
          ) : (
            <Button type="button" variant="contained" onClick={handleNext}>
              {t('create.actions.next')}
            </Button>
          )}
        </DialogActions>
      </Box>
    </Dialog>
  )
}
