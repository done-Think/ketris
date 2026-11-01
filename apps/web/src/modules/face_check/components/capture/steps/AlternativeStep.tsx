'use client'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'

import { ErrorNotice } from '../../ui'
import type { AlternativeReason } from '../../../types'

import { useAgencyName } from '../../../hooks/use-agency-name'
import { useRequestAlternative } from '../../../hooks/use-capture-mutations'
import { alternativeSchema, type AlternativeFormValues } from '../../../schemas/capture.schemas'
import { useCaptureFlow } from '../../../stores/CaptureFlowProvider'
import type { CaptureStepProps } from '../../../types/capture.types'
import { CaptureLayout } from '../CaptureLayout'
import {
  alternativeStepStyles as styles,
  resultStepStyles,
  stepStyles,
} from '../../../styles/capture.styles'

const reasons: AlternativeReason[] = ['noCamera', 'accessibility', 'noConsent', 'other']

export function AlternativeStep({ session }: CaptureStepProps) {
  const t = useTranslations('face_check.capture.alternative')
  const goTo = useCaptureFlow((state) => state.goTo)
  const clearImages = useCaptureFlow((state) => state.clearImages)
  const request = useRequestAlternative(session.token)
  const agency = useAgencyName(session)
  const { control, handleSubmit, formState } = useForm<AlternativeFormValues>({
    resolver: zodResolver(alternativeSchema),
    defaultValues: { reason: null, contact: '' },
  })

  if (request.isSuccess) {
    return (
      <CaptureLayout captureMode={session.captureMode}>
        <Box sx={resultStepStyles.root}>
          <Box sx={resultStepStyles.illustration('info')}>
            <CheckRoundedIcon />
          </Box>
          <Typography component="h1" sx={resultStepStyles.title}>
            {t('sentTitle')}
          </Typography>
          <Typography sx={resultStepStyles.body}>{t('sentBody', { agency })}</Typography>
        </Box>
      </CaptureLayout>
    )
  }

  const onSubmit = handleSubmit((values) => request.mutate(values, { onSuccess: clearImages }))

  return (
    <CaptureLayout
      captureMode={session.captureMode}
      onBack={() => goTo('consent')}
      footer={
        <Button size="large" variant="contained" disabled={request.isPending} onClick={onSubmit}>
          {t('submit')}
        </Button>
      }
    >
      <Box sx={stepStyles.intro}>
        <Typography component="h1" sx={stepStyles.title}>
          {t('title')}
        </Typography>
        <Typography sx={stepStyles.body}>{t('body')}</Typography>
      </Box>

      <Controller
        control={control}
        name="reason"
        render={({ field }) => (
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={styles.legend}>
              {t('reasonLegend')}
            </FormLabel>
            <RadioGroup
              sx={styles.reasonGroup}
              value={field.value ?? ''}
              onChange={(event) => field.onChange(event.target.value as AlternativeReason)}
            >
              {reasons.map((reason) => (
                <FormControlLabel
                  key={reason}
                  value={reason}
                  control={<Radio />}
                  label={t(`reasons.${reason}`)}
                  sx={styles.reasonOption(field.value === reason)}
                />
              ))}
            </RadioGroup>
          </FormControl>
        )}
      />

      <Controller
        control={control}
        name="contact"
        render={({ field }) => (
          <TextField
            {...field}
            label={t('contactLabel')}
            placeholder={t('contactPlaceholder')}
            error={!!formState.errors.contact}
            helperText={
              formState.errors.contact?.message === 'contactTooLong'
                ? t('errors.contactTooLong')
                : undefined
            }
            fullWidth
          />
        )}
      />

      {request.error ? <ErrorNotice error={request.error} /> : null}
    </CaptureLayout>
  )
}
