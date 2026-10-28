'use client'

import { useMemo } from 'react'
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
import { getApiErrorCode } from '@shared/utils/error-message'

import { useSubmitPropertyInquiry } from '../../hooks/use-submit-property-inquiry'
import { createPropertyInquirySchema } from '../../schemas/property-inquiry-schema'
import type {
  PropertyInquiryDialogProps,
  PropertyInquiryFormValues,
} from '../../types/property-detail'
import { styles } from '../../styles/property-inquiry-dialog.styles'

const defaultValues: PropertyInquiryFormValues = {
  website: '',
  leadName: '',
  leadEmail: '',
  leadPhone: '',
  proposedValue: undefined,
  notes: '',
}

export function PropertyInquiryDialog(props: PropertyInquiryDialogProps) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: styles.paper } }}
    >
      {props.open ? <PropertyInquiryForm {...props} /> : null}
    </Dialog>
  )
}

function PropertyInquiryForm({ mode, propertyId, onClose }: PropertyInquiryDialogProps) {
  const t = useTranslations('marketplace.propertyDetail.inquiryDialog')
  const { enqueueSnackbar } = useSnackbar()
  const submitInquiry = useSubmitPropertyInquiry(propertyId)
  const schema = useMemo(() => createPropertyInquirySchema((key) => t(`errors.${key}`)), [t])
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PropertyInquiryFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  function onSubmit(values: PropertyInquiryFormValues) {
    submitInquiry.mutate(
      {
        website: values.website || undefined,
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
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Box
        component="input"
        {...register('website')}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        sx={styles.honeypot}
      />
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
      <DialogActions sx={styles.dialogActions}>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button type="submit" variant="contained" disabled={submitInquiry.isPending}>
          {t('submit')}
        </Button>
      </DialogActions>
    </Box>
  )
}
