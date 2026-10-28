'use client'

import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, LinearProgress, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'
import { useUploadContractDocument } from '../../hooks/use-contract-documents'
import { createContractDocumentSchema } from '../../schemas/contract-document-schema'
import { contractError } from '../../utils/contract-error'
import type { ContractDocumentForm, ContractDocumentUploadProps } from '../../types/workflow'

export function ContractDocumentUpload({ contractId, onBusyChange }: ContractDocumentUploadProps) {
  const t = useTranslations('contracts.documents')
  const errors = useTranslations('contracts.errors')
  const [progress, setProgress] = useState(0)
  const schema = useMemo(() => createContractDocumentSchema((key) => t(`validation.${key}`)), [t])
  const { control, handleSubmit, reset } = useForm<ContractDocumentForm>({
    resolver: zodResolver(schema),
  })
  const mutation = useUploadContractDocument(contractId, setProgress)
  async function submit({ file }: ContractDocumentForm) {
    onBusyChange(true)
    setProgress(0)
    try {
      await mutation.mutateAsync(file)
      reset()
      return true
    } catch {
      return false
    } finally {
      onBusyChange(false)
    }
  }
  return (
    <Stack
      component="form"
      spacing={1.5}
      onSubmit={(event) => {
        const form = event.currentTarget
        void handleSubmit(async (values) => {
          if (await submit(values)) form.reset()
        })(event)
      }}
    >
      <Controller
        control={control}
        name="file"
        render={({ field, fieldState }) => (
          <TextField
            type="file"
            label={t('file')}
            inputRef={field.ref}
            onBlur={field.onBlur}
            disabled={mutation.isPending}
            InputLabelProps={{ shrink: true }}
            inputProps={{ accept: 'application/pdf,.pdf' }}
            onChange={(event) => {
              field.onChange((event.target as HTMLInputElement).files?.[0])
              mutation.reset()
            }}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? t('limits')}
          />
        )}
      />
      {mutation.isPending && (
        <LinearProgress variant="determinate" value={progress} aria-label={t('progress')} />
      )}
      {mutation.isError && <Alert severity="error">{contractError(mutation.error, errors)}</Alert>}
      {mutation.isSuccess && <Alert severity="success">{t('success')}</Alert>}
      <Button type="submit" variant="outlined" disabled={mutation.isPending}>
        {t('upload')}
      </Button>
    </Stack>
  )
}
