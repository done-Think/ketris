'use client'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Skeleton,
  Slider,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'

import { useValidationMessage } from '../../../hooks/use-validation-message'

import { ErrorNotice, PageHeader } from '../../ui'
import { similarityPolicy } from '../../../utils/similarity-policy'

import { useUpdateSettings } from '../../../hooks/use-console-mutations'
import { useSettings } from '../../../hooks/use-console-queries'
import { settingsSchema, type SettingsFormValues } from '../../../schemas/console.schemas'
import type { SettingsFormProps } from '../../../types/console.types'
import { cardStyles, settingsStyles as styles } from '../../../styles/console.styles'

const attemptOptions = [1, 2, 3, 4, 5] as const
const limits = ['injection', 'serverDecides', 'uploads'] as const

function SettingsForm({ settings }: SettingsFormProps) {
  const t = useTranslations('face_check.console.settings')
  const validationMessage = useValidationMessage()
  const format = useFormatter()
  const { data: session } = useSession()
  const canEdit = session?.scope === 'tenant' && session.role === 'OWNER'
  const save = useUpdateSettings()
  const { control, handleSubmit, reset, formState, watch } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  })
  const galleryOn = watch('allowGalleryUpload')
  const saved = save.isSuccess && !formState.isDirty

  const onSubmit = handleSubmit((values) =>
    canEdit ? save.mutate(values, { onSuccess: (data) => reset(data) }) : undefined,
  )

  return (
    <Box component="form" noValidate onSubmit={onSubmit}>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Box sx={styles.actions}>
            {saved ? (
              <Typography role="status" component="span" sx={styles.saved}>
                <CheckRoundedIcon sx={styles.savedIcon} />
                {t('saved')}
              </Typography>
            ) : null}
            <Button
              type="submit"
              variant="contained"
              disabled={!canEdit || save.isPending || !formState.isDirty}
            >
              {t('save')}
            </Button>
          </Box>
        }
      />

      {!canEdit ? <Alert severity="info">{t('ownerOnly')}</Alert> : null}
      <Box
        component="fieldset"
        disabled={!canEdit || save.isPending}
        sx={{ border: 0, p: 0, m: 0, minWidth: 0, ...styles.grid }}
      >
        <Box component="section" aria-labelledby="agency-title" sx={cardStyles.card}>
          <Box>
            <Typography id="agency-title" component="h2" sx={cardStyles.title}>
              {t('agency.title')}
            </Typography>
            <Typography sx={cardStyles.caption}>{t('agency.subtitle')}</Typography>
          </Box>
          <Controller
            control={control}
            name="agencyName"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label={t('agency.name')}
                slotProps={{ input: { readOnly: true } }}
                error={!!fieldState.error}
                helperText={
                  fieldState.error?.message
                    ? validationMessage(fieldState.error.message)
                    : undefined
                }
              />
            )}
          />
        </Box>

        <Box component="section" aria-labelledby="thresholds-title" sx={cardStyles.card}>
          <Box>
            <Typography id="thresholds-title" component="h2" sx={cardStyles.title}>
              {t('thresholds.title')}
            </Typography>
            <Typography sx={cardStyles.caption}>{t('thresholds.subtitle')}</Typography>
          </Box>
          <Controller
            control={control}
            name="faceMatchThreshold"
            render={({ field }) => (
              <Box>
                <Box sx={styles.sliderHeader}>
                  <Typography id="faceMatchThreshold-label" sx={styles.sliderLabel}>
                    {t('thresholds.faceMatchThreshold')}
                  </Typography>
                  <Typography component="span">
                    {format.number(field.value, { maximumFractionDigits: 3 })}
                  </Typography>
                </Box>
                <Slider
                  disabled
                  aria-labelledby="faceMatchThreshold-label"
                  value={field.value}
                  min={similarityPolicy.approveAbove}
                  max={0.9}
                  step={0.01}
                />
                <Typography sx={styles.help}>{t('thresholds.faceMatchHelp')}</Typography>
              </Box>
            )}
          />
          <Controller
            control={control}
            name="maxAttempts"
            render={({ field }) => (
              <TextField
                {...field}
                select
                label={t('thresholds.maxAttempts')}
                onChange={(event) => field.onChange(Number(event.target.value))}
              >
                {attemptOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Box>

        <Box component="section" aria-labelledby="capture-title" sx={cardStyles.card}>
          <Typography id="capture-title" component="h2" sx={cardStyles.title}>
            {t('capture.title')}
          </Typography>
          <Controller
            control={control}
            name="allowGalleryUpload"
            render={({ field }) => (
              <Box sx={styles.switchRow}>
                <Box>
                  <Typography id="gallery-label" sx={styles.switchLabel}>
                    {t('capture.gallery')}
                  </Typography>
                  <Typography sx={styles.help}>{t('capture.galleryHelp')}</Typography>
                </Box>
                <Switch
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  slotProps={{ input: { 'aria-labelledby': 'gallery-label' } }}
                />
              </Box>
            )}
          />
          {galleryOn ? <Alert severity="warning">{t('capture.galleryOn')}</Alert> : null}
        </Box>

        <Box component="section" aria-labelledby="limits-title" sx={cardStyles.card}>
          <Typography id="limits-title" component="h2" sx={cardStyles.title}>
            {t('limits.title')}
          </Typography>
          <Box component="ul" sx={styles.limits}>
            {limits.map((key) => (
              <li key={key}>{t(`limits.items.${key}`)}</li>
            ))}
          </Box>
        </Box>
      </Box>
      {save.error ? <ErrorNotice error={save.error} /> : null}
    </Box>
  )
}

export function SettingsPage() {
  const settings = useSettings()

  if (settings.error) return <ErrorNotice error={settings.error} />
  if (!settings.data) return <Skeleton variant="rounded" height={520} />

  return <SettingsForm settings={settings.data} />
}
