'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { useValidationMessage } from '../../../hooks/use-validation-message'

import { ErrorNotice } from '../../ui'
import type { DecisionKind, DecisionReason } from '../../../types'

import { useActorLabel } from '../../../hooks/use-actor-label'
import { useDecideSession } from '../../../hooks/use-console-mutations'
import { createDecisionSchema, type DecisionFormValues } from '../../../schemas/console.schemas'
import type { SessionCardProps } from '../../../types/console.types'
import { cardStyles, detailStyles as styles } from '../../../styles/console.styles'
import { ReopenAttempt } from './ReopenAttempt'
import { buildDecisionInput } from '../../../utils/decision-input'
import { areEvidenceImagesDeleted } from '../../../utils/evidence-retention'

const decisions: DecisionKind[] = ['approve', 'redo', 'reject']
const reasons: DecisionReason[] = ['match', 'mismatch', 'illegible', 'tampered', 'liveness']

function DecisionSummary({ session }: SessionCardProps) {
  const t = useTranslations('face_check.console.detail.decision')
  const actorLabel = useActorLabel(session)
  const format = useFormatter()
  const last = [...session.timeline]
    .reverse()
    .find((event) => event.kind === 'decision' || event.kind === 'reopened')

  if (last?.kind === 'reopened') {
    return (
      <Alert severity="info">
        {t('reopenedSummary', {
          actor: actorLabel(last.actor),
          date: format.dateTime(new Date(last.at), { dateStyle: 'short', timeStyle: 'short' }),
        })}
      </Alert>
    )
  }

  if (last?.decision) {
    return (
      <Alert severity={last.decision === 'approve' ? 'success' : 'info'}>
        {t('summary', {
          decision: t(`choices.${last.decision}.done`),
          actor: actorLabel(last.actor),
          date: format.dateTime(new Date(last.at), { dateStyle: 'short', timeStyle: 'short' }),
        })}
      </Alert>
    )
  }

  return (
    <Typography sx={cardStyles.caption}>
      {session.status === 'APPROVED' ? t('autoApproved') : t('notReady')}
    </Typography>
  )
}

function DecisionForm({ session }: SessionCardProps) {
  const t = useTranslations('face_check.console.detail.decision')
  const validationMessage = useValidationMessage()
  const decide = useDecideSession(session.id)
  const [pending, setPending] = useState<DecisionFormValues | null>(null)
  const attemptsLeft = session.maxAttempts - session.attemptsUsed
  const requiresManualOverride = session.reviewReason !== 'autoApprovalPaused'
  const { control, handleSubmit, watch, setValue } = useForm<DecisionFormValues>({
    resolver: zodResolver(createDecisionSchema(requiresManualOverride)),
    defaultValues: {
      decision: null,
      reason: null,
      note: '',
      manualOverride: false,
      reviewedEvidence: false,
    },
  })
  const decision = watch('decision')
  const manualOverride = decision === 'approve' && watch('manualOverride')
  const overrideAllowed = session.manualOverrideAllowed === true
  const reasonRequired = decision === 'redo' || decision === 'reject' || manualOverride

  const confirm = () => {
    if (!pending) return
    const input = buildDecisionInput(pending, overrideAllowed, requiresManualOverride)
    if (!input) return
    decide.mutate(input, { onSettled: () => setPending(null) })
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(setPending)} sx={styles.form}>
      <Controller
        control={control}
        name="decision"
        render={({ field, fieldState }) => (
          <FormControl error={!!fieldState.error}>
            <FormLabel sx={styles.legend}>{t('question')}</FormLabel>
            <RadioGroup
              sx={styles.choiceGroup}
              value={field.value ?? ''}
              onChange={(event) => {
                field.onChange(event.target.value as DecisionKind)
                setValue('manualOverride', false)
                setValue('reviewedEvidence', false)
              }}
            >
              {decisions.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  disabled={
                    (option === 'redo' && attemptsLeft <= 0) ||
                    (option === 'approve' &&
                      (areEvidenceImagesDeleted(session) ||
                        (requiresManualOverride && !overrideAllowed)))
                  }
                  control={<Radio />}
                  sx={styles.choice(field.value === option)}
                  label={
                    <Box>
                      <Typography sx={styles.choiceLabel}>
                        {t(`choices.${option}.label`)}
                      </Typography>
                      <Typography sx={styles.choiceHelp}>
                        {t(`choices.${option}.help`, { attemptsLeft })}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
            {fieldState.error?.message ? (
              <FormHelperText>{validationMessage(fieldState.error.message)}</FormHelperText>
            ) : null}
          </FormControl>
        )}
      />
      {decision === 'approve' && overrideAllowed ? (
        <>
          <Alert severity="warning">{t('manualOverride.help')}</Alert>
          <Controller
            control={control}
            name="manualOverride"
            render={({ field, fieldState }) => (
              <FormControl error={!!fieldState.error}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => {
                        field.onChange(event.target.checked)
                        setValue('reviewedEvidence', false)
                      }}
                    />
                  }
                  label={t('manualOverride.choose')}
                />
                {fieldState.error?.message ? (
                  <FormHelperText>{validationMessage(fieldState.error.message)}</FormHelperText>
                ) : null}
              </FormControl>
            )}
          />
          {manualOverride ? (
            <Controller
              control={control}
              name="reviewedEvidence"
              render={({ field, fieldState }) => (
                <FormControl error={!!fieldState.error}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        required
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    }
                    label={t('manualOverride.reviewed')}
                  />
                  {fieldState.error?.message ? (
                    <FormHelperText>{validationMessage(fieldState.error.message)}</FormHelperText>
                  ) : null}
                </FormControl>
              )}
            />
          ) : null}
        </>
      ) : null}
      <Controller
        control={control}
        name="reason"
        render={({ field, fieldState }) => (
          <TextField
            select
            label={reasonRequired ? t('reasonRequired') : t('reasonOptional')}
            value={field.value ?? ''}
            onChange={(event) =>
              field.onChange((event.target.value || null) as DecisionReason | null)
            }
            onBlur={field.onBlur}
            error={!!fieldState.error}
            helperText={
              fieldState.error?.message ? validationMessage(fieldState.error.message) : undefined
            }
          >
            <MenuItem value="">{t('reasonPlaceholder')}</MenuItem>
            {reasons.map((reason) => (
              <MenuItem key={reason} value={reason}>
                {t(`reasons.${reason}`)}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        control={control}
        name="note"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            multiline
            minRows={3}
            label={t('note')}
            placeholder={t('notePlaceholder')}
            error={!!fieldState.error}
            helperText={
              fieldState.error?.message ? validationMessage(fieldState.error.message) : undefined
            }
          />
        )}
      />
      {decide.error ? <ErrorNotice error={decide.error} /> : null}
      <Button type="submit" variant="contained" disabled={decide.isPending}>
        {t('submit')}
      </Button>

      <Dialog open={!!pending} onClose={() => setPending(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('confirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>
            {pending?.decision
              ? t(`choices.${pending.decision}.confirm`, { name: session.personName })
              : null}
          </Typography>
          {pending?.decision === 'approve' && pending.manualOverride ? (
            <Alert severity="warning">{t('manualOverride.confirm')}</Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="secondary" onClick={() => setPending(null)}>
            {t('back')}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            disabled={decide.isPending || (pending?.manualOverride === true && !overrideAllowed)}
            onClick={confirm}
          >
            {t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export function DecisionCard({ session }: SessionCardProps) {
  const t = useTranslations('face_check.console.detail.decision')

  return (
    <Box component="section" aria-labelledby="decision-title" sx={cardStyles.card}>
      <Typography id="decision-title" component="h2" sx={cardStyles.title}>
        {t('title')}
      </Typography>
      {session.status === 'REVIEW' ? (
        <DecisionForm key={`${session.id}:${session.attemptsUsed}`} session={session} />
      ) : (
        <DecisionSummary session={session} />
      )}
      {session.status === 'REJECTED' ? <ReopenAttempt session={session} /> : null}
    </Box>
  )
}
