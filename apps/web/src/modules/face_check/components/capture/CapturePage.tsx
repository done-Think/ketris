'use client'

import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded'
import { Box, Button, CircularProgress, Typography } from '@mui/material'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

import { extractErrorCode } from '../../utils/error-code'

import { useCaptureSession } from '../../hooks/use-capture-queries'
import { CaptureFlowProvider, useCaptureFlow } from '../../stores/CaptureFlowProvider'
import { CapturePresentationProvider } from '../../stores/CapturePresentationProvider'
import type { CapturePageProps } from '../../types/capture.types'
import { resolveVisibleStep } from '../../utils/resolve-visible-step'
import { CaptureLayout } from './CaptureLayout'
import { resultStepStyles } from '../../styles/capture.styles'
import { AlternativeStep } from './steps/AlternativeStep'
import { CameraStep } from './steps/CameraStep'
import { ConsentStep } from './steps/ConsentStep'
import { DocumentReviewStep } from './steps/DocumentReviewStep'
import { CaptureReviewStep } from './steps/CaptureReviewStep'
import { LiveDocumentStep } from './steps/LiveDocumentStep'
import { LiveSelfieStep } from './steps/LiveSelfieStep'
import { ResultStep } from './steps/ResultStep'
import { SubmitStep } from './steps/SubmitStep'

function CaptureFlow({ token }: CapturePageProps) {
  const t = useTranslations('face_check.capture')
  const tErrors = useTranslations('face_check.common.errors')
  const session = useCaptureSession(token)
  const step = useCaptureFlow((state) => state.step)

  if (session.isPending) {
    return (
      <CaptureLayout>
        <Box sx={resultStepStyles.root}>
          <CircularProgress aria-label={t('loading')} />
        </Box>
      </CaptureLayout>
    )
  }

  if (session.isError) {
    return (
      <CaptureLayout>
        <Box sx={resultStepStyles.root}>
          <Box sx={resultStepStyles.illustration('error')}>
            <LinkOffRoundedIcon />
          </Box>
          <Typography component="h1" sx={resultStepStyles.title}>
            {t('unavailable')}
          </Typography>
          <Typography sx={resultStepStyles.body}>
            {tErrors.has(extractErrorCode(session.error))
              ? tErrors(extractErrorCode(session.error))
              : tErrors('UNKNOWN')}
          </Typography>
          <Button component={Link} href="/" variant="contained">
            {t('backHome')}
          </Button>
        </Box>
      </CaptureLayout>
    )
  }

  const data = session.data
  const visible = resolveVisibleStep(step, data.status)

  switch (visible) {
    case 'camera':
      return <CameraStep session={data} />
    case 'document':
      return <LiveDocumentStep session={data} />
    case 'documentReview':
      return <DocumentReviewStep session={data} />
    case 'captureReview':
      return <CaptureReviewStep session={data} />
    case 'selfie':
      return <LiveSelfieStep session={data} />
    case 'submit':
      return <SubmitStep session={data} />
    case 'result':
      return <ResultStep session={data} />
    case 'alternative':
      return <AlternativeStep session={data} />
    default:
      return <ConsentStep session={data} />
  }
}

export function CapturePage({ token, variant = 'standalone' }: CapturePageProps) {
  return (
    <CapturePresentationProvider variant={variant}>
      <CaptureFlowProvider key={token}>
        <CaptureFlow token={token} />
      </CaptureFlowProvider>
    </CapturePresentationProvider>
  )
}
