'use client'

import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import type { ContractTransitionDialogProps } from '../../types/workflow'
import { contractError } from '../../utils/contract-error'

export function ContractTransitionDialog({
  action,
  pending,
  error,
  onClose,
  onConfirm,
}: ContractTransitionDialogProps) {
  const t = useTranslations('contracts.transition')
  const errors = useTranslations('contracts.errors')
  const schema = useMemo(
    () => z.object({ reason: z.string().trim().min(1, t('required')).max(10000, t('tooLong')) }),
    [t],
  )
  const { control, handleSubmit } = useForm({
    defaultValues: { reason: '' },
    resolver: zodResolver(schema),
  })
  return (
    <Dialog open onClose={pending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t(`${action}Title`)}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Alert severity="info">{t('notice')}</Alert>
          <Controller
            name="reason"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                multiline
                minRows={3}
                label={t('reason')}
                disabled={pending}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
          {Boolean(error) && <Alert severity="error">{contractError(error, errors)}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={pending} onClick={onClose}>
          {t('back')}
        </Button>
        <Button
          color="error"
          variant="contained"
          disabled={pending}
          onClick={handleSubmit(({ reason }) => onConfirm(reason))}
        >
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
