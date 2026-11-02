'use client'

import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

import type { LivenessChallenge } from '../../../types'
import { ApiError } from '../../../services/api-error'

import { useCameraStream } from '../../../hooks/use-camera-stream'
import { useLivenessSequence } from '../../../hooks/use-liveness-sequence'
import { useCaptureSound } from '../../../hooks/use-capture-sound'
import { useFaceProximity } from '../../../hooks/use-face-proximity'
import { useSelfieFraming } from '../../../hooks/use-selfie-framing'
import { useCaptureDevice } from '../../../hooks/use-capture-device'
import type { FaceGuideGeometry } from '../../../types/face-framing.types'
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
  const { goTo, livenessStep, advanceLiveness, resetLiveness, syncLivenessStep } = useCaptureFlow(
    (state) => state,
  )
  const {
    status: cameraStatus,
    attachVideo,
    grabFrame,
    sampleFrame,
    restart: retryCamera,
  } = useCameraStream('user')
  const selfieAccepted = livenessStep > 0
  const challenges = useLivenessChallenges(session.token, selfieAccepted)
  const upload = useUploadSelfie(session.token)
  const frame = useUploadLivenessFrame(session.token)
  const submit = useSubmitCapture(session.token)
  const [captureFailed, setCaptureFailed] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [capturedPhase, setCapturedPhase] = useState<SelfiePhase | null>(null)
  const [geometry, setGeometry] = useState<FaceGuideGeometry | null>(null)
  const intro = useRef<HTMLDivElement>(null)
  const device = useCaptureDevice()
  const sound = useCaptureSound()
  const list = challenges.data ?? []
  const awaitingChallenges = selfieAccepted && !challenges.data
  const phase = resolveSelfiePhase(livenessStep, list)
  const live = cameraStatus === 'live'
  const sequence = useLivenessSequence({
    token: session.token,
    enabled: live && selfieAccepted && !upload.isPending && !submit.isPending,
    prepareSound: sound.prepare,
    tickSound: sound.tick,
    onProgress: syncLivenessStep,
    capture: async (challenge, signal) => {
      let image: Blob
      try {
        image = await grabFrame()
      } catch (error) {
        setCaptureFailed(true)
        throw error
      }
      signal.throwIfAborted()
      sound.play()
      setCapturedPhase(challenge)
      setCaptureFailed(false)
      return frame.mutateAsync({ challenge, image, signal })
    },
  })
  const proximity = useFaceProximity({
    token: session.token,
    enabled:
      live && phase === 'closer' && !sequence.running && !frame.isPending && !challenges.isFetching,
    grabFrame,
  })
  const captured = capturedPhase === phase && (upload.isPending || frame.isPending)
  const busy =
    upload.isPending ||
    frame.isPending ||
    submit.isPending ||
    challenges.isFetching ||
    awaitingChallenges ||
    preparing ||
    sequence.running
  const framing = useSelfieFraming({
    token: session.token,
    enabled: live && phase === 'position' && !busy,
    sampleFrame,
    geometry,
  })
  const ring =
    phase === 'position'
      ? framing === 'ready'
        ? 'ok'
        : framing === 'checking' || framing === 'unavailable'
          ? 'active'
          : 'warn'
      : phase === 'closer' && proximity.ready
        ? 'ok'
        : ringFor(phase)
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
  const send = () => submit.mutate(undefined, { onSuccess: () => goTo('submit') })
  const restart = () => {
    sequence.reset()
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
        onClick={() => {
          intro.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
          setCapturedPhase(null)
          frame.reset()
          void sequence.start()
        }}
        startIcon={frame.isPending ? <CircularProgress size={18} color="inherit" /> : null}
      >
        {sequence.remaining !== null
          ? tLive('captureIn', { seconds: sequence.remaining })
          : frame.isPending
            ? tLive('checking')
            : sequence.running
              ? tLive('sequenceRunning')
              : tLive(sequence.started ? 'resumeMovements' : 'startMovements')}
      </Button>
      {sequence.running ? (
        <Button sx={stepStyles.darkSecondaryAction} onClick={sequence.stop}>
          {tLive('pauseMovements')}
        </Button>
      ) : null}
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
              sequence.running
            }
            onClick={() => goTo('alternative')}
          >
            {t('cantDo')}
          </Button>
        </>
      }
    >
      <Box ref={intro} sx={stepStyles.intro}>
        <Typography component="h1" sx={stepStyles.darkTitle}>
          {awaitingChallenges ? tLive('preparingChallenges') : t(`titles.${phase}`)}
        </Typography>
        {sequence.remaining !== null ? (
          <Typography role="status" aria-live="assertive" aria-atomic sx={styles.countdown}>
            {tLive('captureIn', { seconds: sequence.remaining })}
          </Typography>
        ) : null}
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

      {cameraStatus !== 'live' && cameraStatus !== 'starting' ? (
        <Box sx={liveStyles.selfieNotice}>
          <CameraFallback
            token={session.token}
            status={cameraStatus}
            allowGallery={false}
            onFile={() => undefined}
            onAlternative={() => goTo('alternative')}
            onRetry={retryCamera}
            disabled={busy}
          />
        </Box>
      ) : (
        <FaceViewport
          ring={ring}
          arrow={arrow}
          onGeometryChange={setGeometry}
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
            : phase === 'position'
              ? t(`framing.${framing}`, { device })
              : phase === 'closer' && proximity.ready
                ? tLive('closeEnough')
                : phase === 'closer'
                  ? t('framing.closer', { device })
                  : t(`hints.${phase}`)}
        </Box>
      </Box>
      {captureFailed ? (
        <Alert severity="error" variant="outlined">
          {tLive('captureFailed')}
        </Alert>
      ) : null}
      {upload.error && !showBackgroundHint ? <PhotoErrorNotice error={upload.error} /> : null}
      {sequence.error && !captureFailed ? <PhotoErrorNotice error={sequence.error} /> : null}
      {submit.error ? <PhotoErrorNotice error={submit.error} /> : null}
    </CaptureLayout>
  )
}
