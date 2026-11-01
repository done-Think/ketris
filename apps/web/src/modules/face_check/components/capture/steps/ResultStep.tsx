'use client'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import { Box, Button, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { ErrorNotice } from '../../ui'
import { captureProtocol } from '../../../utils/capture-protocol'

import { useAgencyName } from '../../../hooks/use-agency-name'
import { useConsent } from '../../../hooks/use-capture-mutations'
import { useCaptureFlow } from '../../../stores/CaptureFlowProvider'
import type { CaptureStepProps, ResultIllustrationProps } from '../../../types/capture.types'
import { CaptureLayout } from '../CaptureLayout'
import { resultStepStyles as styles, stepStyles } from '../../../styles/capture.styles'

function ResultIllustration({ tone, children }: ResultIllustrationProps) {
  return <Box sx={styles.illustration(tone)}>{children}</Box>
}

export function ResultStep({ session }: CaptureStepProps) {
  const t = useTranslations('face_check.capture.result')
  const goTo = useCaptureFlow((state) => state.goTo)
  const restartAttempt = useCaptureFlow((state) => state.restartAttempt)
  const retry = useConsent(session.token, session.captureMode)
  const agency = useAgencyName(session)

  const protocol = (
    <Box sx={styles.card}>
      <Box sx={styles.protocolRow}>
        <Typography component="span" sx={styles.muted}>
          {t('protocol')}
        </Typography>
        <Typography component="span" sx={styles.protocolValue}>
          {captureProtocol(session.token)}
        </Typography>
      </Box>
    </Box>
  )

  const view = (
    tone: ResultIllustrationProps['tone'],
    icon: ReactNode,
    key: 'approved' | 'review' | 'rejected' | 'expired',
    extra?: ReactNode,
  ) => (
    <CaptureLayout captureMode={session.captureMode}>
      <Box sx={styles.root}>
        <ResultIllustration tone={tone}>{icon}</ResultIllustration>
        <Typography component="h1" sx={styles.title}>
          {t(`${key}.title`)}
        </Typography>
        <Typography sx={styles.body}>{t(`${key}.body`, { agency })}</Typography>
        {extra}
        <Box sx={stepStyles.spacer} />
        <Typography sx={styles.muted}>{t('closeHint')}</Typography>
      </Box>
    </CaptureLayout>
  )

  if (session.status === 'APPROVED')
    return view('success', <CheckRoundedIcon />, 'approved', protocol)

  if (session.status === 'REVIEW') {
    return view(
      'warning',
      <ManageSearchRoundedIcon />,
      'review',
      <>
        <Box sx={styles.card}>
          <Typography sx={styles.cardTitle}>{t('review.nextTitle')}</Typography>
          <Box component="ol" sx={styles.list}>
            {(['one', 'two', 'three'] as const).map((key) => (
              <li key={key}>{t(`review.next.${key}`)}</li>
            ))}
          </Box>
        </Box>
        {protocol}
      </>,
    )
  }

  if (session.status === 'REJECTED') return view('info', <InfoOutlinedIcon />, 'rejected', protocol)

  if (session.status === 'RESUBMISSION_REQUESTED') {
    const onRetry = () => retry.mutate(undefined, { onSuccess: restartAttempt })

    return (
      <CaptureLayout
        captureMode={session.captureMode}
        footer={
          <>
            <Button size="large" variant="contained" disabled={retry.isPending} onClick={onRetry}>
              {t('redo.retry')}
            </Button>
            <Button sx={stepStyles.secondaryAction} onClick={() => goTo('alternative')}>
              {t('redo.human')}
            </Button>
          </>
        }
      >
        <Box sx={styles.root}>
          <ResultIllustration tone="error">
            <ReplayRoundedIcon />
          </ResultIllustration>
          <Typography component="h1" sx={styles.title}>
            {t('redo.title')}
          </Typography>
          <Typography sx={styles.body}>
            {t(`redo.reasons.${session.redoReason ?? 'documentIllegible'}`, {
              agency,
            })}
          </Typography>
          <Box sx={styles.card}>
            <Typography sx={styles.cardTitle}>{t('redo.tipsTitle')}</Typography>
            <Box component="ul" sx={styles.list}>
              {(['one', 'two', 'three'] as const).map((key) => (
                <li key={key}>{t(`redo.tips.${key}`)}</li>
              ))}
            </Box>
          </Box>
          <Box component="span" sx={styles.attempts}>
            {t('redo.attemptsLeft', { left: session.attemptsLeft, max: session.maxAttempts })}
          </Box>
          {retry.error ? <ErrorNotice error={retry.error} /> : null}
        </Box>
      </CaptureLayout>
    )
  }

  return view('info', <EventBusyOutlinedIcon />, 'expired')
}
