'use client'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Box, Button, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { CaptureStepProps } from '../../../types/capture.types'
import { CaptureLayout } from '../CaptureLayout'
import { resultStepStyles as styles } from '../../../styles/capture.styles'

export function SubmitStep({ session }: CaptureStepProps) {
  const t = useTranslations('face_check.capture.submit')
  const tCapture = useTranslations('face_check.capture')

  return (
    <CaptureLayout
      captureMode={session.captureMode}
      progressStep="submit"
      footer={
        <Button component={Link} href="/" size="large" variant="contained">
          {tCapture('backHome')}
        </Button>
      }
    >
      <Box sx={styles.root} role="status">
        <Box sx={styles.illustration('success')}>
          <CheckRoundedIcon />
        </Box>
        <Typography component="h1" sx={styles.title}>
          {t('receivedTitle')}
        </Typography>
        <Typography sx={styles.body}>
          {t('receivedBody', { agency: session.agencyName })}
        </Typography>
        <Typography sx={styles.muted}>{t('closeHint')}</Typography>
      </Box>
    </CaptureLayout>
  )
}
