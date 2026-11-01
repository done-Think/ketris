'use client'

import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { LivenessChallenge } from '../../../types'
import { ApiError } from '../../../services/api-error'

import { useCameraStream } from '../../../hooks/use-camera-stream'
import { useCountdown } from '../../../hooks/use-countdown'
import { useCaptureSound } from '../../../hooks/use-capture-sound'
import { useFaceProximity } from '../../../hooks/use-face-proximity'
import {
  useSubmitCapture,
  useUploadLivenessFrame,
  useUploadSelfie,
} from '../../../hooks/use-capture-mutations'
import { useLivenessChallenges } from '../../../hooks/use-capture-queries'
import { useCaptureFlow } from '../../../stores/CaptureFlowProvider'
import type { CaptureStepProps, FaceRing, SelfiePhase } from '../../../types/capture.types'
import { resolveSelfiePhase } from '../../../utils/resolve-visible-step'
import { CameraFallback } from '../CameraFallback'
import { CaptureLayout } from '../CaptureLayout'
import { FaceViewport } from '../FaceViewport'
import { PhotoErrorNotice } from '../PhotoErrorNotice'
import {
  liveCaptureStyles as liveStyles,
  selfieStepStyles as styles,
  stepStyles,
} from '../../../styles/capture.styles'
import { faceViewportStyles } from '../../../styles/viewports.styles'

const challengeCountdownSeconds = 3

function ringFor(phase: SelfiePhase): FaceRing {
  if (phase === 'position') return 'warn'
  if (phase === 'done') return 'ok'

  return 'active'
}

function isChallenge(phase: SelfiePhase): phase is LivenessChallenge {
  return phase !== 'position' && phase !== 'done'
}

export function LiveSelfieStep({ session }: CaptureStepProps) {
  const t = useTranslations('face_check.capture.selfie')
  const tLive = useTranslations('face_check.capture.live')
  const { goTo, livenessStep, advanceLiveness, resetLiveness, retryChallenges } = useCaptureFlow(
    (state) => state,
  )
  const { status: cameraStatus, attachVideo, grabFrame } = useCameraStream('user')
  const selfieAccepted = livenessStep > 0
  const challenges = useLivenessChallenges(session.token, selfieAccepted)
  const upload = useUploadSelfie(session.token)
  const frame = useUploadLivenessFrame(session.token)
  const submit = useSubmitCapture(session.token)
  const [captureFailed, setCaptureFailed] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [capturedPhase, setCapturedPhase] = useState<SelfiePhase | null>(null)
  const sound = useCaptureSound()
  const countdown = useCountdown(challengeCountdownSeconds)
  const list = challenges.data ?? []
  const awaitingChallenges = selfieAccepted && !challenges.data
  const phase = resolveSelfiePhase(livenessStep, list)
  const live = cameraStatus === 'live'
  const proximity = useFaceProximity({
    token: session.token,
    enabled: live && phase === 'closer' && !preparing && !frame.isPending && !challenges.isFetching,
    grabFrame,
  })
  const ring = phase === 'closer' && proximity.ready ? 'ok' : ringFor(phase)
  const captured = capturedPhase === phase && (upload.isPending || frame.isPending)
  const busy =
    upload.isPending ||
    frame.isPending ||
    submit.isPending ||
    challenges.isFetching ||
    awaitingChallenges ||
    preparing ||
    countdown.remaining !== null
  const arrow = phase === 'turnLeft' ? 'left' : phase === 'turnRight' ? 'right' : null
  const showBackgroundHint =
    phase === 'position' &&
    upload.error instanceof ApiError &&
    upload.error.code === 'PHOTO_REJECTED' &&
    upload.error.reason === 'looksLikeDocument'

  const takeSelfie = () => {
    sound.prepare()
    setPreparing(true)
    setCapturedPhase(null)
    proximity.reset()
    void grabFrame()
      .then((image) => {
        sound.play()
        setCapturedPhase('position')
        setCaptureFailed(false)
        frame.reset()
        upload.mutate(image, {
          onSuccess: () => {
            proximity.reset()
            advanceLiveness(list.length)
          },
        })
      })
      .catch(() => setCaptureFailed(true))
      .finally(() => setPreparing(false))
  }
  const captureChallenge = (challenge: LivenessChallenge) => {
    setPreparing(true)
    void grabFrame()
      .then((image) => {
        sound.play()
        setCapturedPhase(challenge)
        setCaptureFailed(false)
        frame.mutate(
          { challenge, image },
          {
            onSuccess: () => {
              proximity.reset()
              advanceLiveness(list.length)
            },
            onError: () => {
              proximity.reset()
              retryChallenges()
            },
          },
        )
      })
      .catch(() => setCaptureFailed(true))
      .finally(() => setPreparing(false))
  }
  const takeChallenge = (challenge: LivenessChallenge) => {
    sound.prepare()
    setCapturedPhase(null)
    frame.reset()
    countdown.start(() => captureChallenge(challenge))
  }
  const send = () => submit.mutate(undefined, { onSuccess: () => goTo('submit') })
  const restart = () => {
    proximity.reset()
    setCapturedPhase(null)
    upload.reset()
    frame.reset()
    resetLiveness()
  }

  const footer = awaitingChallenges ? (
    <>
      {challenges.error ? (
        <>
          <PhotoErrorNotice error={challenges.error} />
          <Button
            variant="contained"
            disabled={challenges.isFetching}
            onClick={() => void challenges.refetch()}
          >
            {tLive('retryChallenges')}
          </Button>
        </>
      ) : (
        <CircularProgress size={24} aria-label={tLive('preparingChallenges')} />
      )}
      <Typography>{tLive('preparingChallenges')}</Typography>
    </>
  ) : phase === 'position' ? (
    <>
      <Button
        size="large"
        variant="contained"
        disabled={!live || busy}
        onClick={takeSelfie}
        startIcon={upload.isPending ? <CircularProgress size={18} color="inherit" /> : null}
      >
        {upload.isPending ? tLive('checking') : tLive('takeSelfie')}
      </Button>
      {showBackgroundHint ? (
        <Alert severity="error" variant="outlined" sx={liveStyles.selfieBackgroundAlert}>
          {tLive('selfieBackgroundHint')}
        </Alert>
      ) : null}
    </>
  ) : isChallenge(phase) ? (
    <>
      <Typography sx={liveStyles.challengeNote}>{tLive('challengeHint')}</Typography>
      <Button
        size="large"
        variant="contained"
        disabled={!live || busy}
        onClick={() => takeChallenge(phase)}
        startIcon={frame.isPending ? <CircularProgress size={18} color="inherit" /> : null}
      >
        {countdown.remaining !== null
          ? tLive('holdStill', { seconds: countdown.remaining })
          : frame.isPending
            ? tLive('checking')
            : tLive('takeChallenge')}
      </Button>
    </>
  ) : (
    <>
      <Button
        size="large"
        variant="contained"
        disabled={busy}
        onClick={send}
        startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
      >
        {busy ? tLive('checking') : t('send')}
      </Button>
      <Button sx={stepStyles.darkSecondaryAction} disabled={busy} onClick={restart}>
        {t('restart')}
      </Button>
    </>
  )

  return (
    <CaptureLayout
      captureMode={session.captureMode}
      tone="dark"
      progressStep="selfie"
      onBack={busy || selfieAccepted ? undefined : () => goTo('documentReview')}
      footer={
        <>
          {footer}
          <Button
            sx={stepStyles.darkSecondaryAction}
            disabled={
              upload.isPending ||
              frame.isPending ||
              submit.isPending ||
              preparing ||
              countdown.remaining !== null
            }
            onClick={() => goTo('alternative')}
          >
            {t('cantDo')}
          </Button>
        </>
      }
    >
      <Box sx={stepStyles.intro}>
        <Typography component="h1" sx={stepStyles.darkTitle}>
          {awaitingChallenges ? tLive('preparingChallenges') : t(`titles.${phase}`)}
        </Typography>
        <Box sx={styles.segments} aria-hidden>
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              sx={styles.segment(
                index < livenessStep ? 'done' : index === livenessStep ? 'current' : 'pending',
              )}
            />
          ))}
        </Box>
      </Box>

      {cameraStatus === 'denied' || cameraStatus === 'unavailable' ? (
        <Box sx={liveStyles.selfieNotice}>
          <CameraFallback
            status={cameraStatus}
            allowGallery={false}
            onFile={() => undefined}
            onAlternative={() => goTo('alternative')}
          />
        </Box>
      ) : (
        <FaceViewport
          ring={ring}
          arrow={arrow}
          media={
            <Box
              component="video"
              ref={attachVideo}
              autoPlay
              playsInline
              muted
              aria-label={tLive('selfiePreview')}
              sx={faceViewportStyles.media}
            />
          }
        />
      )}

      <Box aria-live="polite" sx={styles.hintRow}>
        <Box component="span" sx={styles.hint(ring)}>
          {captured
            ? tLive('captured')
            : phase === 'closer' && proximity.ready
              ? tLive('closeEnough')
              : t(`hints.${phase}`)}
        </Box>
      </Box>
      {captureFailed ? (
        <Alert severity="error" variant="outlined">
          {tLive('captureFailed')}
        </Alert>
      ) : null}
      {upload.error && !showBackgroundHint ? <PhotoErrorNotice error={upload.error} /> : null}
      {frame.error ? <PhotoErrorNotice error={frame.error} /> : null}
      {submit.error ? <PhotoErrorNotice error={submit.error} /> : null}
    </CaptureLayout>
  )
}
