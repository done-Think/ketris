'use client'

import { useEffect, useMemo } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSnackbar } from 'notistack'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'

import { radius } from '@shared/theme/tokens'
import { getApiErrorCode } from '@shared/utils/error-message'

import { useSubmitPropertyInquiry } from '../../hooks/use-submit-property-inquiry'
import { createPropertyInquirySchema } from '../../schemas/property-inquiry-schema'
import type {
  PropertyInquiryDialogProps,
  PropertyInquiryFormValues,
} from '../../types/property-detail'

const defaultValues: PropertyInquiryFormValues = {
  leadName: '',
  leadEmail: '',
  leadPhone: '',
  proposedValue: undefined,
  notes: '',
}

export function PropertyInquiryDialog({
  open,
  mode,
  propertyId,
  onClose,
}: PropertyInquiryDialogProps) {
  const t = useTranslations('marketplace.propertyDetail.inquiryDialog')
  const { enqueueSnackbar } = useSnackbar()
  const submitInquiry = useSubmitPropertyInquiry(propertyId)
  const schema = useMemo(() => createPropertyInquirySchema((key) => t(`errors.${key}`)), [t])
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PropertyInquiryFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  useEffect(() => {
    if (open) reset(defaultValues)
  }, [open, reset])

  function onSubmit(values: PropertyInquiryFormValues) {
    submitInquiry.mutate(
      {
        leadName: values.leadName,
        leadEmail: values.leadEmail,
        leadPhone: values.leadPhone || undefined,
        proposedValue: mode === 'proposal' ? values.proposedValue : undefined,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          enqueueSnackbar(t('success'), { variant: 'success' })
          onClose()
        },
        onError: (error) => {
          const rateLimited = getApiErrorCode(error) === 'RATE_LIMIT_EXCEEDED'
          enqueueSnackbar(t(rateLimited ? 'rateLimited' : 'error'), { variant: 'error' })
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: `${radius.sm}px` } } }}
    >
      <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{t(mode === 'visit' ? 'visitTitle' : 'proposalTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography color="text.secondary" variant="body2">
              {t(mode === 'visit' ? 'visitDescription' : 'proposalDescription')}
            </Typography>
            <Controller
              control={control}
              name="leadName"
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('name')}
                  fullWidth
                  autoFocus
                  error={Boolean(errors.leadName)}
                  helperText={errors.leadName?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="leadEmail"
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('email')}
                  type="email"
                  fullWidth
                  error={Boolean(errors.leadEmail)}
                  helperText={errors.leadEmail?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="leadPhone"
              render={({ field }) => <TextField {...field} label={t('phone')} fullWidth />}
            />
            {mode === 'proposal' && (
              <Controller
                control={control}
                name="proposedValue"
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('proposedValue')}
                    type="number"
                    fullWidth
                    error={Boolean(errors.proposedValue)}
                    helperText={errors.proposedValue?.message}
                  />
                )}
              />
            )}
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('notes')}
                  placeholder={t(
                    mode === 'visit' ? 'notesPlaceholderVisit' : 'notesPlaceholderProposal',
                  )}
                  fullWidth
                  multiline
                  minRows={2}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
          <Button variant="outlined" color="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={submitInquiry.isPending}>
            {t('submit')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
