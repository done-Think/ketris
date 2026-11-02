'use client'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Box, Button, LinearProgress, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

import { isCaptureInFlight } from '../../../utils/session-status'

import { captureKeys } from '../../../hooks/capture-query-keys'
import { useCaptureStatus } from '../../../hooks/use-capture-queries'
import { useCaptureFlow } from '../../../stores/CaptureFlowProvider'
import type { CaptureStepProps } from '../../../types/capture.types'
import { CaptureLayout } from '../CaptureLayout'
import { ErrorNotice } from '../../ui'
import { stepStyles, submitStepStyles as styles } from '../../../styles/capture.styles'

const phases = [
  { key: 'document', until: 30 },
  { key: 'selfie', until: 50 },
  { key: 'liveness', until: 75 },
  { key: 'analysis', until: 100 },
] as const

export function SubmitStep({ session }: CaptureStepProps) {
  const t = useTranslations('face_check.capture.submit')
  const goTo = useCaptureFlow((state) => state.goTo)
  const queryClient = useQueryClient()
  const status = useCaptureStatus(session.token)
  const progress = status.data?.progress ?? 0
  const finished = status.data ? !isCaptureInFlight(status.data.status) : false

  const showResult = async () => {
    await queryClient.invalidateQueries({ queryKey: captureKeys.session(session.token) })
    goTo('result')
  }

  return (
    <CaptureLayout
      captureMode={session.captureMode}
      progressStep="submit"
      footer={
        <Button size="large" variant="contained" disabled={!finished} onClick={showResult}>
          {finished ? t('viewResult') : t('analysing')}
        </Button>
      }
    >
      <Box sx={stepStyles.intro}>
        <Typography component="h1" sx={stepStyles.title}>
          {finished ? t('titleDone') : t('titleRunning')}
        </Typography>
        <Typography sx={stepStyles.body}>{t('body')}</Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={finished ? 100 : progress}
        aria-label={t('progressLabel')}
        sx={styles.progress}
      />

      <Box component="ol" aria-live="polite" sx={styles.list}>
        {phases.map((phase, index) => {
          const start = index === 0 ? 0 : phases[index - 1].until
          const done = finished || progress >= phase.until
          const active = !done && progress >= start
          const percent = Math.round(((progress - start) / (phase.until - start)) * 100)
          const state = done ? 'done' : active ? 'active' : 'waiting'
          const statusText = done
            ? t('stepStatus.done')
            : active
              ? phase.key === 'analysis'
                ? t('stepStatus.analysing')
                : t('stepStatus.sending', { percent })
              : t('stepStatus.waiting')

          return (
            <Box component="li" key={phase.key} sx={styles.item}>
              <Box component="span" sx={styles.dot(state)}>
                {done ? <CheckRoundedIcon sx={styles.dotIcon} /> : null}
              </Box>
              <Box>
                <Typography sx={styles.itemLabel}>{t(`steps.${phase.key}`)}</Typography>
                <Typography sx={styles.itemStatus}>{statusText}</Typography>
              </Box>
            </Box>
          )
        })}
      </Box>
      {status.error ? <ErrorNotice error={status.error} /> : null}
    </CaptureLayout>
  )
}
