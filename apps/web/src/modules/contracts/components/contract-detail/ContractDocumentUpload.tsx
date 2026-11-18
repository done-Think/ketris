'use client'

import { useId, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  FormControl,
  FormHelperText,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'
import { useUploadContractDocument } from '../../hooks/use-contract-documents'
import { createContractDocumentSchema } from '../../schemas/contract-document-schema'
import { contractError } from '../../utils/contract-error'
import type { ContractDocumentForm, ContractDocumentUploadProps } from '../../types/workflow'
import { styles } from '../../styles/contract-document-upload.styles'

export function ContractDocumentUpload({ contractId, onBusyChange }: ContractDocumentUploadProps) {
  const t = useTranslations('contracts.documents')
  const errors = useTranslations('contracts.errors')
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const inputId = useId()
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
          <FormControl error={Boolean(fieldState.error)} disabled={mutation.isPending}>
            <Typography component="label" htmlFor={inputId} sx={styles.label}>
              {t('file')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={styles.selector}>
              <input
                id={inputId}
                type="file"
                accept="application/pdf,.pdf"
                name={field.name}
                ref={(element) => {
                  field.ref(element)
                  inputRef.current = element
                }}
                hidden
                disabled={mutation.isPending}
                aria-describedby={`${inputId}-helper`}
                aria-invalid={Boolean(fieldState.error)}
                onBlur={field.onBlur}
                onChange={(event) => {
                  field.onChange(event.target.files?.[0])
                  mutation.reset()
                }}
              />
              <Button
                type="button"
                variant="outlined"
                startIcon={<CloudUploadOutlinedIcon />}
                disabled={mutation.isPending}
                onClick={() => inputRef.current?.click()}
                onBlur={field.onBlur}
                aria-describedby={`${inputId}-helper`}
                sx={styles.chooseButton}
              >
                {t('chooseFile')}
              </Button>
              <Typography sx={styles.fileName} title={field.value?.name} aria-live="polite">
                {field.value?.name ?? t('noFileSelected')}
              </Typography>
            </Stack>
            <FormHelperText id={`${inputId}-helper`}>
              {fieldState.error?.message ?? t('limits')}
            </FormHelperText>
          </FormControl>
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
