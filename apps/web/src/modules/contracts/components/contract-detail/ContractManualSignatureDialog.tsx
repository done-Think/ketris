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
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import type { ContractManualSignatureDialogProps } from '../../types/workflow'
import { contractError } from '../../utils/contract-error'

export function ContractManualSignatureDialog({
  party,
  documents,
  dataRevision,
  pending,
  error,
  onClose,
  onConfirm,
}: ContractManualSignatureDialogProps) {
  const t = useTranslations('contracts.signature')
  const errors = useTranslations('contracts.errors')
  const available = documents.filter(
    (document) =>
      document.canDownload && document.sha256 && document.contractRevision === dataRevision,
  )
  const schema = useMemo(
    () =>
      z.object({
        documentId: z
          .string()
          .min(1, t('required'))
          .refine((id) => available.some((document) => document.id === id), t('required')),
      }),
    [available, t],
  )
  const { control, handleSubmit } = useForm({
    defaultValues: { documentId: '' },
    resolver: zodResolver(schema),
  })
  return (
    <Dialog open onClose={pending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Alert severity="info">{t('manualNotice')}</Alert>
          <Typography>{t('party', { name: party.name })}</Typography>
          {!available.length && <Alert severity="warning">{t('noDocument')}</Alert>}
          <Controller
            control={control}
            name="documentId"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                label={t('document')}
                disabled={pending}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              >
                {available.map((document) => (
                  <MenuItem key={document.id} value={document.id}>
                    {document.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          {Boolean(error) && <Alert severity="error">{contractError(error, errors)}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          {t('back')}
        </Button>
        <Button
          onClick={handleSubmit(({ documentId }) => onConfirm(documentId))}
          disabled={pending || !available.length}
          variant="contained"
        >
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
