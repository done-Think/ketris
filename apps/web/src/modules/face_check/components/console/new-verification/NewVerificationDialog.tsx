'use client'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  CircularProgress,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'

import { useValidationMessage } from '../../../hooks/use-validation-message'

import { ErrorNotice } from '../../ui'

import { hasLostFaceCheckAccess } from '../../../utils/query-access'

import { useCreateSession } from '../../../hooks/use-console-mutations'
import { useFaceCheckProperties } from '../../../hooks/use-console-queries'
import {
  newVerificationSchema,
  type NewVerificationFormValues,
} from '../../../schemas/console.schemas'
import type {
  NewVerificationContentProps,
  NewVerificationDialogProps,
} from '../../../types/console.types'
import { dialogStyles as styles } from '../../../styles/console.styles'
import { CreatedLinkPanel } from './CreatedLinkPanel'

const documentOptions = ['ANY', 'RG', 'CNH', 'RNE'] as const
const expiryOptions = [24, 48, 168] as const

function NewVerificationContent({ onClose }: NewVerificationContentProps) {
  const t = useTranslations('face_check.console.newVerification')
  const validationMessage = useValidationMessage()
  const create = useCreateSession()
  const properties = useFaceCheckProperties()
  const availableProperties = hasLostFaceCheckAccess(properties.error) ? undefined : properties.data
  const { control, handleSubmit } = useForm<NewVerificationFormValues>({
    resolver: zodResolver(newVerificationSchema),
    defaultValues: {
      propertyId: '',
      purpose: 'RENT',
      personName: '',
      cpf: '',
      reference: '',
      contact: '',
      acceptedDocument: 'ANY',
      expiresInHours: 24,
    },
  })

  const header = (
    <DialogTitle sx={styles.header}>
      <Box>
        <Typography variant="overline" component="span" sx={styles.eyebrow}>
          {t('eyebrow')}
        </Typography>
        <Typography component="span" sx={styles.title}>
          {create.data ? t('createdTitle') : t('title')}
        </Typography>
      </Box>
      <IconButton aria-label={t('close')} onClick={onClose}>
        <CloseRoundedIcon />
      </IconButton>
    </DialogTitle>
  )

  if (create.data) {
    return (
      <>
        {header}
        <CreatedLinkPanel created={create.data} onClose={onClose} />
      </>
    )
  }

  const onSubmit = handleSubmit((values) => create.mutate(values))
  const errorText = (message?: string) => (message ? validationMessage(message) : undefined)

  return (
    <>
      {header}
      <DialogContent sx={styles.content}>
        {properties.isPending ? (
          <CircularProgress size={24} aria-label={t('loadingProperties')} />
        ) : null}
        {properties.error ? <ErrorNotice error={properties.error} /> : null}
        {availableProperties?.length === 0 ? (
          <Alert severity="info">{t('noProperties')}</Alert>
        ) : null}
        <Controller
          control={control}
          name="propertyId"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              select
              required
              label={t('fields.propertyId')}
              disabled={!availableProperties?.length || properties.isPending}
              error={!!fieldState.error}
              helperText={errorText(fieldState.error?.message)}
            >
              {(availableProperties ?? []).map((property) => (
                <MenuItem key={property.id} value={property.id}>
                  {property.title}
                  {property.address ? ` · ${property.address}` : ''}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          control={control}
          name="purpose"
          render={({ field }) => (
            <TextField {...field} select required label={t('fields.purpose')}>
              {(['RENT', 'BUY'] as const).map((value) => (
                <MenuItem key={value} value={value}>
                  {t(`purposeOptions.${value}`)}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          control={control}
          name="personName"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              autoFocus
              required
              label={t('fields.personName')}
              error={!!fieldState.error}
              helperText={errorText(fieldState.error?.message)}
            />
          )}
        />
        <Controller
          control={control}
          name="contact"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              autoComplete="email"
              label={t('fields.contact')}
              placeholder={t('fields.contactPlaceholder')}
              slotProps={{
                htmlInput: {
                  inputMode: 'email',
                  autoCapitalize: 'none',
                  spellCheck: false,
                  maxLength: 120,
                },
              }}
              error={!!fieldState.error}
              helperText={errorText(fieldState.error?.message) ?? t('contactEmailHelp')}
            />
          )}
        />
        <Controller
          control={control}
          name="cpf"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t('fields.cpf')}
              placeholder={t('fields.cpfPlaceholder')}
              inputMode="numeric"
              error={!!fieldState.error}
              helperText={errorText(fieldState.error?.message) ?? t('fields.cpfHelp')}
            />
          )}
        />
        <Box sx={styles.grid}>
          <Controller
            control={control}
            name="reference"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label={t('fields.reference')}
                placeholder={t('fields.referencePlaceholder')}
                error={!!fieldState.error}
                helperText={errorText(fieldState.error?.message)}
              />
            )}
          />
          <Controller
            control={control}
            name="acceptedDocument"
            render={({ field }) => (
              <TextField {...field} select label={t('fields.acceptedDocument')}>
                {documentOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {t(`documentOptions.${option}`)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            control={control}
            name="expiresInHours"
            render={({ field }) => (
              <TextField
                {...field}
                select
                label={t('fields.expiresInHours')}
                onChange={(event) => field.onChange(Number(event.target.value))}
              >
                {expiryOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {t(`expiryOptions.${option}`)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Box>
        <Typography sx={styles.hint}>{t('dataMinimization')}</Typography>
        {create.error ? <ErrorNotice error={create.error} /> : null}
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={create.isPending || !availableProperties?.length || properties.isPending}
          onClick={onSubmit}
        >
          {t('submit')}
        </Button>
      </DialogActions>
    </>
  )
}

export function NewVerificationDialog({ open, onClose }: NewVerificationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {open ? <NewVerificationContent onClose={onClose} /> : null}
    </Dialog>
  )
}
