'use client'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined'
import { Box, Button, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useCaptureFlow } from '../../../stores/CaptureFlowProvider'
import type { CaptureStepProps } from '../../../types/capture.types'
import { CaptureLayout } from '../CaptureLayout'
import { ContinueOnPhoneButton } from '../ContinueOnPhoneButton'
import { cameraStepStyles, stepStyles } from '../../../styles/capture.styles'

const tips = ['light', 'original', 'face'] as const

export function CameraStep({ session }: CaptureStepProps) {
  const t = useTranslations('face_check.capture.camera')
  const goTo = useCaptureFlow((state) => state.goTo)
  return (
    <CaptureLayout
      captureMode={session.captureMode}
      progressStep="document"
      onBack={() => goTo('consent')}
      footer={
        <>
          <Button size="large" variant="contained" onClick={() => goTo('document')}>
            {t('enable')}
          </Button>
          <ContinueOnPhoneButton token={session.token} />
          <Button onClick={() => goTo('alternative')}>{t('withoutCamera')}</Button>
        </>
      }
    >
      <Box sx={cameraStepStyles.preview}>
        <VideocamOutlinedIcon sx={cameraStepStyles.previewIcon} />
      </Box>
      <Box sx={stepStyles.intro}>
        <Typography component="h1" sx={stepStyles.title}>
          {t('title')}
        </Typography>
        <Typography sx={stepStyles.body}>{t('body')}</Typography>
      </Box>
      <Box component="ul" sx={stepStyles.checkList}>
        {tips.map((key) => (
          <Box component="li" key={key} sx={stepStyles.checkItem}>
            <CheckRoundedIcon sx={stepStyles.checkIcon} />
            {t(`tips.${key}`)}
          </Box>
        ))}
      </Box>
    </CaptureLayout>
  )
}
