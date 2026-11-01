'use client'

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Link,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { ErrorNotice } from '../../ui'

import { useAgencyName } from '../../../hooks/use-agency-name'
import { useConsent } from '../../../hooks/use-capture-mutations'
import { consentSchema, type ConsentFormValues } from '../../../schemas/capture.schemas'
import { useCaptureFlow } from '../../../stores/CaptureFlowProvider'
import type { CaptureStepProps } from '../../../types/capture.types'
import { CaptureLayout } from '../CaptureLayout'
import { stepStyles } from '../../../styles/capture.styles'

const infoItems = [
  { key: 'collect', Icon: BadgeOutlinedIcon },
  { key: 'purpose', Icon: VerifiedUserOutlinedIcon },
  { key: 'retention', Icon: ScheduleRoundedIcon },
] as const

export function ConsentStep({ session }: CaptureStepProps) {
  const t = useTranslations('face_check.capture.consent')
  const goTo = useCaptureFlow((state) => state.goTo)
  const consent = useConsent(session.token, session.captureMode)
  const agency = useAgencyName(session)
  const { control, handleSubmit, watch } = useForm<ConsentFormValues>({
    resolver: zodResolver(consentSchema),
    defaultValues: { accepted: false },
  })
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const accepted = watch('accepted')

  const onSubmit = handleSubmit(() =>
    consent.mutate(undefined, { onSuccess: () => goTo('camera') }),
  )

  return (
    <CaptureLayout
      captureMode={session.captureMode}
      progressStep="consent"
      footer={
        <>
          <Button
            size="large"
            variant="contained"
            disabled={consent.isPending}
            onClick={() => setPrivacyOpen(true)}
          >
            {t('start')}
          </Button>
          <Button sx={stepStyles.secondaryAction} onClick={() => goTo('alternative')}>
            {t('alternative')}
          </Button>
        </>
      }
    >
      <Box sx={stepStyles.intro}>
        <Typography component="h1" sx={stepStyles.title}>
          {t('title')}
        </Typography>
        <Typography sx={stepStyles.body}>
          {t('intro', { agency, reference: session.reference ?? '—' })}
        </Typography>
      </Box>

      <Box component="section" sx={stepStyles.card} aria-label={t('sectionLabel')}>
        {infoItems.map(({ key, Icon }) => (
          <Box key={key} sx={stepStyles.infoRow}>
            <Box sx={stepStyles.infoIcon}>
              <Icon fontSize="small" />
            </Box>
            <Box>
              <Typography sx={stepStyles.infoTitle}>{t(`items.${key}.title`)}</Typography>
              <Typography sx={stepStyles.infoBody}>{t(`items.${key}.body`)}</Typography>
            </Box>
          </Box>
        ))}
        <Link
          component="button"
          type="button"
          onClick={() => setPrivacyOpen(true)}
          sx={stepStyles.link}
        >
          {t('privacyLink')}
        </Link>
      </Box>

      <Alert severity="info">{t('pilotNotice')}</Alert>

      <Dialog
        open={privacyOpen}
        onClose={consent.isPending ? undefined : () => setPrivacyOpen(false)}
        aria-labelledby="capture-privacy-title"
        aria-describedby="capture-privacy-description"
      >
        <DialogTitle id="capture-privacy-title">{t('privacyLink')}</DialogTitle>
        <DialogContent>
          <Typography id="capture-privacy-description" sx={stepStyles.body}>
            {t('privacyBody')}
          </Typography>
          <Controller
            control={control}
            name="accepted"
            render={({ field }) => (
              <FormControlLabel
                sx={stepStyles.consentLabel(field.value)}
                control={
                  <Checkbox
                    required
                    checked={field.value}
                    disabled={consent.isPending}
                    onChange={(event) => field.onChange(event.target.checked)}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                  />
                }
                label={t('acknowledgement')}
              />
            )}
          />
          {consent.error ? <ErrorNotice error={consent.error} /> : null}
        </DialogContent>
        <DialogActions>
          <Button disabled={consent.isPending} onClick={() => setPrivacyOpen(false)}>
            {t('close')}
          </Button>
          <Button variant="contained" disabled={!accepted || consent.isPending} onClick={onSubmit}>
            {t('continue')}
          </Button>
        </DialogActions>
      </Dialog>
    </CaptureLayout>
  )
}
