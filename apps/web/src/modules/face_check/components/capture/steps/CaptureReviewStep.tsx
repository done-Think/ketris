'use client'

import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useCaptureFlow } from '../../../stores/CaptureFlowProvider'
import { useSubmitCaptureDrafts } from '../../../hooks/use-submit-capture-drafts'
import type { CaptureStepProps } from '../../../types/capture.types'
import type { CaptureUploadSlot } from '../../../types/capture-draft.types'
import { CaptureLayout } from '../CaptureLayout'
import { PhotoErrorNotice } from '../PhotoErrorNotice'
import { documentReviewStyles as styles, stepStyles } from '../../../styles/capture.styles'

const slots: CaptureUploadSlot[] = ['front', 'back', 'selfie', 'turnLeft', 'turnRight', 'closer']

export function CaptureReviewStep({ session }: CaptureStepProps) {
  const t = useTranslations('face_check.capture.review')
  const flow = useCaptureFlow((state) => state)
  const send = useSubmitCaptureDrafts(session.token)
  const previews = { ...flow.previews, selfie: flow.selfiePreview, ...flow.movementPreviews }
  return (
    <CaptureLayout
      captureMode={session.captureMode}
      progressStep="submit"
      onBack={send.isPending ? undefined : () => flow.goTo('selfie')}
      footer={
        <Button
          size="large"
          variant="contained"
          disabled={send.isPending || slots.some((slot) => !previews[slot])}
          startIcon={send.isPending ? <CircularProgress size={18} color="inherit" /> : null}
          onClick={() =>
            send.mutate(flow, {
              onSuccess: () => {
                flow.goTo('submit')
                flow.clearImages()
              },
            })
          }
        >
          {send.isPending ? t('sending') : t('send')}
        </Button>
      }
    >
      <Box sx={stepStyles.intro}>
        <Typography component="h1" sx={stepStyles.title}>
          {t('title')}
        </Typography>
        <Typography sx={stepStyles.body}>
          {t(Object.keys(flow.uploaded).length ? 'resumeBody' : 'body')}
        </Typography>
      </Box>
      {send.error ? (
        <>
          <PhotoErrorNotice error={send.error} />
          {send.stage ? (
            <Alert severity="warning">
              {t('failedPhoto', { photo: t(`photos.${send.stage}`) })}
            </Alert>
          ) : null}
        </>
      ) : null}
      {send.isPending && send.stage ? (
        <Typography role="status">{t('checking', { photo: t(`photos.${send.stage}`) })}</Typography>
      ) : null}
      <Box sx={styles.reviewGrid}>
        {slots.map((slot) => (
          <Box component="section" key={slot} sx={stepStyles.card}>
            <Typography component="h2" sx={styles.sideLabel}>
              {t(`photos.${slot}`)}
            </Typography>
            {previews[slot] ? (
              <Box sx={styles.preview}>
                <Box
                  component="img"
                  loading="lazy"
                  decoding="async"
                  src={previews[slot]!}
                  alt={t(`photos.${slot}`)}
                  sx={styles.photoPreview}
                />
              </Box>
            ) : null}
            <Button
              variant="outlined"
              disabled={send.isPending}
              onClick={() => flow.retakePhoto(slot)}
            >
              {t('retake')}
            </Button>
          </Box>
        ))}
      </Box>
    </CaptureLayout>
  )
}
