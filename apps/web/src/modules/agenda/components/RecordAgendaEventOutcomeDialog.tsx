'use client'

import { styles } from '../styles/record-agenda-event-outcome-dialog.styles'

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import {
  AGENDA_VISIT_INTERESTS,
  requiresAgendaVisitInterest,
} from '@shared/lib/utils/agenda-outcome'

import { buildRecordAgendaEventOutcomeSchema } from '../schemas/record-agenda-event-outcome-schema'
import type {
  RecordAgendaEventOutcomeDialogProps,
  RecordAgendaEventOutcomeValues,
} from '../types/agenda-event'

export function RecordAgendaEventOutcomeDialog(props: RecordAgendaEventOutcomeDialogProps) {
  return props.open ? <RecordAgendaEventOutcomeDialogContent {...props} /> : null
}

function RecordAgendaEventOutcomeDialogContent({
  open,
  isPending,
  event,
  onClose,
  onConfirm,
}: RecordAgendaEventOutcomeDialogProps) {
  const t = useTranslations('agenda.eventDetail.outcomeDialog')
  const interestT = useTranslations('agenda.eventDetail.visitInterests')
  const schema = useMemo(
    () => buildRecordAgendaEventOutcomeSchema((key) => t(key), event.apiKind),
    [t, event.apiKind],
  )
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RecordAgendaEventOutcomeValues>({
    defaultValues: {
      outcome: event.status === 'NO_SHOW' ? 'NO_SHOW' : 'COMPLETED',
      visitInterest: event.visitInterest ?? null,
      notes: event.outcomeNotes ?? '',
    },
    resolver: zodResolver(schema),
  })
  const outcome = useWatch({ control, name: 'outcome' })
  const pending = isPending || isSubmitting

  return (
    <Dialog open={open} onClose={() => !pending && onClose()} fullWidth maxWidth="xs">
      <form noValidate onSubmit={handleSubmit(onConfirm)}>
        <DialogTitle sx={styles.dialogTitle}>{t('title')}</DialogTitle>
        <DialogContent>
          <Typography sx={styles.description}>
            {t('description', { title: event.title })}
          </Typography>

          <Box sx={styles.section}>
            <Typography id="agenda-outcome-label" sx={styles.label}>
              {t('outcome')}
            </Typography>
            <Controller
              control={control}
              name="outcome"
              render={({ field }) => (
                <ToggleButtonGroup
                  exclusive
                  value={field.value}
                  onChange={(_event, next) => next && field.onChange(next)}
                  aria-labelledby="agenda-outcome-label"
                  disabled={pending}
                  sx={styles.outcomeGroup}
                >
                  <ToggleButton value="COMPLETED">
                    <CheckCircleRoundedIcon />
                    {t('outcomes.COMPLETED')}
                  </ToggleButton>
                  {!event.internal && (
                    <ToggleButton value="NO_SHOW">
                      <EventBusyRoundedIcon />
                      {t('outcomes.NO_SHOW')}
                    </ToggleButton>
                  )}
                </ToggleButtonGroup>
              )}
            />
          </Box>

          {requiresAgendaVisitInterest(outcome, event.apiKind) && (
            <Box sx={styles.section}>
              <Typography id="agenda-interest-label" sx={styles.label}>
                {t('interest')}
              </Typography>
              <Controller
                control={control}
                name="visitInterest"
                render={({ field, fieldState }) => (
                  <>
                    <ToggleButtonGroup
                      exclusive
                      value={field.value}
                      onChange={(_event, next) => next && field.onChange(next)}
                      aria-labelledby="agenda-interest-label"
                      disabled={pending}
                      sx={styles.interestGroup}
                    >
                      {AGENDA_VISIT_INTERESTS.map((interest) => (
                        <ToggleButton key={interest} value={interest}>
                          {interestT(interest)}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                    {fieldState.error ? (
                      <FormHelperText error sx={styles.interestError}>
                        {fieldState.error.message}
                      </FormHelperText>
                    ) : null}
                  </>
                )}
              />
            </Box>
          )}

          <RhfTextField
            control={control}
            name="notes"
            label={t('notes')}
            multiline
            minRows={3}
            fullWidth
            disabled={pending}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={pending} onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button variant="contained" disabled={pending} type="submit">
            {pending ? <CircularProgress size={20} /> : t('confirm')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
