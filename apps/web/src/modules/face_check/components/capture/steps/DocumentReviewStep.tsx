'use client'

import { Box, Button, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useCaptureFlow } from '../../../stores/CaptureFlowProvider'
import type { CaptureStepProps } from '../../../types/capture.types'
import { CaptureLayout } from '../CaptureLayout'
import { documentReviewStyles as styles, stepStyles } from '../../../styles/capture.styles'
import { hasCompleteSelfieDrafts } from '../../../utils/capture-drafts'

export function DocumentReviewStep({ session }: CaptureStepProps) {
  const t = useTranslations('face_check.capture.documentReview')
  const tDocument = useTranslations('face_check.capture.document')
  const flow = useCaptureFlow((state) => state)
  const { goTo, documentType, retakeSide, previews, documentImages } = flow
  const docLabel = tDocument(`types.${documentType ?? 'RG'}`)
  return (
    <CaptureLayout
      captureMode={session.captureMode}
      progressStep="document"
      onBack={() => retakeSide('back')}
      footer={
        <Button
          size="large"
          variant="contained"
          disabled={!documentImages.front || !documentImages.back || !documentType}
          onClick={() => goTo(hasCompleteSelfieDrafts(flow) ? 'captureReview' : 'selfie')}
        >
          {t('confirm')}
        </Button>
      }
    >
      <Box sx={stepStyles.intro}>
        <Typography component="h1" sx={stepStyles.title}>
          {t('title')}
        </Typography>
        <Typography sx={stepStyles.body}>{t('body')}</Typography>
        <Typography sx={stepStyles.body}>{t('beforeSending')}</Typography>
      </Box>
      {(['front', 'back'] as const).map((side) => (
        <Box key={side} component="section" sx={stepStyles.card}>
          {previews[side] ? (
            <Box sx={styles.preview}>
              <Box
                component="img"
                src={previews[side]}
                alt={t('photoLabel', { side: tDocument(`sides.${side}`), doc: docLabel })}
                sx={styles.photoPreview}
              />
            </Box>
          ) : null}
          <Box sx={styles.footerRow}>
            <Typography sx={styles.sideLabel}>
              {t('sideLabel', { side: tDocument(`sides.${side}`), doc: docLabel })}
            </Typography>
            <Button variant="outlined" color="secondary" onClick={() => retakeSide(side)}>
              {t('retake')}
            </Button>
          </Box>
        </Box>
      ))}
    </CaptureLayout>
  )
}
