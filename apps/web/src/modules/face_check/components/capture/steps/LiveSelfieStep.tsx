'use client'

import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCameraStream } from '../../../hooks/use-camera-stream'
import { useLivenessSequence } from '../../../hooks/use-liveness-sequence'
import { useCountdown } from '../../../hooks/use-countdown'
import { useCaptureSound } from '../../../hooks/use-capture-sound'
import { useSelfieFraming } from '../../../hooks/use-selfie-framing'
import { useCaptureDevice } from '../../../hooks/use-capture-device'
import type { FaceGuideGeometry } from '../../../types/face-framing.types'
import { useCaptureFlow } from '../../../stores/CaptureFlowProvider'
import type { CaptureStepProps, SelfiePhase } from '../../../types/capture.types'
import { resolveSelfiePhase } from '../../../utils/resolve-visible-step'
import { CameraFallback } from '../CameraFallback'
import { CaptureLayout } from '../CaptureLayout'
import { FaceViewport } from '../FaceViewport'
import { PhotoErrorNotice } from '../PhotoErrorNotice'
import {
  documentReviewStyles,
  liveCaptureStyles,
  selfieStepStyles as styles,
  stepStyles,
} from '../../../styles/capture.styles'
import { faceViewportStyles } from '../../../styles/viewports.styles'

const movements = ['turnLeft', 'turnRight', 'closer'] as const

export function LiveSelfieStep({ session }: CaptureStepProps) {
  const t = useTranslations('face_check.capture.selfie')
  const tLive = useTranslations('face_check.capture.live')
  const flow = useCaptureFlow((state) => state)
  const {
    status: cameraStatus,
    attachVideo,
    grabFrame,
    sampleFrame,
    restart: restartCamera,
  } = useCameraStream('user')
  const [captureFailed, setCaptureFailed] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [geometry, setGeometry] = useState<FaceGuideGeometry | null>(null)
  const capturing = useRef<AbortController | null>(null)
  const { remaining: selfieRemaining, run: countSelfie, clear: clearSelfieCount } = useCountdown(3)
  const [capturedPhase, setCapturedPhase] = useState<SelfiePhase | null>(null)
  const intro = useRef<HTMLDivElement>(null)
  const device = useCaptureDevice()
  const sound = useCaptureSound()
  const list = flow.plan?.challenges ?? [...movements]
  const phase = resolveSelfiePhase(flow.livenessStep, list)
  const live = cameraStatus === 'live'
  const draft = phase === 'position' && flow.selfieImage !== null
  const movementPreview =
    phase !== 'position' && phase !== 'done' && capturedPhase === phase
      ? flow.movementPreviews[phase]
      : null
  const preview = draft ? flow.selfiePreview : movementPreview
  const lastPose = phase === list[list.length - 1]
  const cameraFailure = cameraStatus !== 'live' && cameraStatus !== 'starting'

  const stopSelfie = useCallback(() => {
    capturing.current?.abort()
    capturing.current = null
    clearSelfieCount()
    setPreparing(false)
  }, [clearSelfieCount])
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stopSelfie()
    }
    document.addEventListener('visibilitychange', hide)
    return () => {
      document.removeEventListener('visibilitychange', hide)
      capturing.current?.abort()
      capturing.current = null
    }
  }, [session.token, stopSelfie])
  useEffect(() => {
    if (!live) stopSelfie()
  }, [live, stopSelfie])

  const sequence = useLivenessSequence({
    token: session.token,
    enabled: live && flow.selfieImage !== null && !preparing,
    planId: flow.plan?.planId ?? null,
    localStep: Math.max(0, flow.livenessStep - 1),
    onPlan: flow.setLivenessPlan,
    prepareSound: sound.prepare,
    tickSound: sound.tick,
    onProgress: flow.syncLivenessStep,
    capture: async (challenge, signal) => {
      try {
        const image = await grabFrame()
        signal.throwIfAborted()
        sound.play()
        flow.captureMovement(challenge, image)
        setCapturedPhase(challenge)
        setCaptureFailed(false)
      } catch (error) {
        if (!signal.aborted) setCaptureFailed(true)
        throw error
      }
    },
  })
  const busy = preparing || sequence.running
  const remaining = selfieRemaining ?? sequence.remaining
  const framing = useSelfieFraming({
    token: session.token,
    enabled: live && phase === 'position' && !busy && !draft,
    sampleFrame,
    geometry,
    localOnly: true,
  })
  const ring =
    phase !== 'position'
      ? 'active'
      : framing === 'ready'
        ? 'ok'
        : framing === 'checking' || framing === 'unavailable'
          ? 'active'
          : 'warn'
  const arrow = phase === 'turnLeft' ? 'left' : phase === 'turnRight' ? 'right' : null

  const takeSelfie = async () => {
    if (capturing.current || busy || !live || document.hidden) return
    const controller = new AbortController()
    capturing.current = controller
    sound.prepare()
    setPreparing(true)
    try {
      await countSelfie(controller.signal, sound.tick)
      // Keep the selfie and movements on the same video grid: the engine compares their eye distances.
      const image = await grabFrame()
      controller.signal.throwIfAborted()
      sound.play()
      flow.captureSelfie(image)
      setCaptureFailed(false)
    } catch {
      if (!controller.signal.aborted) setCaptureFailed(true)
    } finally {
      if (capturing.current === controller) {
        capturing.current = null
        clearSelfieCount()
        setPreparing(false)
      }
    }
  }

  const capturePose = (step = Math.max(0, flow.livenessStep - 1)) => {
    intro.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
    setCapturedPhase(null)
    setCaptureFailed(false)
    void sequence.start(step)
  }
  const review = () => {
    flow.syncLivenessStep(list.length + 1)
    flow.goTo('captureReview')
  }

  const footer =
    phase === 'position' ? (
      <>
        <Button
          size="large"
          variant="contained"
          disabled={busy || !live}
          onClick={draft ? () => capturePose(0) : () => void takeSelfie()}
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {remaining !== null
            ? tLive('captureIn', { seconds: remaining })
            : tLive(busy ? 'preparingPhoto' : draft ? 'nextPose' : 'takeSelfie')}
        </Button>
        {draft ? (
          <Button
            sx={stepStyles.darkSecondaryAction}
            disabled={busy}
            onClick={() => {
              flow.resetLiveness()
              sequence.reset()
              void takeSelfie()
            }}
          >
            {tLive('retakeSelfie')}
          </Button>
        ) : null}
      </>
    ) : phase !== 'done' && movementPreview ? (
      <>
        <Button
          size="large"
          variant="contained"
          disabled={busy || (!lastPose && !live)}
          onClick={lastPose ? review : () => capturePose(flow.livenessStep)}
        >
          {tLive(lastPose ? 'reviewCaptures' : 'nextPose')}
        </Button>
        <Button
          sx={stepStyles.darkSecondaryAction}
          disabled={busy || !live}
          onClick={() => capturePose()}
        >
          {tLive('retakePose')}
        </Button>
      </>
    ) : phase !== 'done' ? (
      <>
        <Typography sx={liveCaptureStyles.challengeNote}>{tLive('challengeHint')}</Typography>
        <Button
          size="large"
          variant="contained"
          disabled={!live || busy}
          onClick={() => {
            capturePose()
          }}
        >
          {remaining !== null
            ? tLive('captureIn', { seconds: remaining })
            : sequence.running
              ? tLive('sequenceRunning')
              : tLive(sequence.started ? 'resumeMovements' : 'startMovements')}
        </Button>
      </>
    ) : (
      <>
        <Button size="large" variant="contained" onClick={review}>
          {tLive('reviewCaptures')}
        </Button>
        <Button
          sx={stepStyles.darkSecondaryAction}
          onClick={() => {
            sequence.reset()
            flow.resetLiveness()
          }}
        >
          {t('restart')}
        </Button>
      </>
    )

  return (
    <CaptureLayout
      captureMode={session.captureMode}
      tone="dark"
      progressStep="selfie"
      onBack={
        busy
          ? undefined
          : () => {
              flow.resetLiveness()
              flow.goTo('documentReview')
            }
      }
      footer={
        <>
          {footer}
          {busy ? (
            <Button
              sx={stepStyles.darkSecondaryAction}
              onClick={() => {
                stopSelfie()
                sequence.stop()
              }}
            >
              {tLive('pauseMovements')}
            </Button>
          ) : null}
          <Button
            sx={stepStyles.darkSecondaryAction}
            disabled={busy}
            onClick={() => flow.goTo('alternative')}
          >
            {t('cantDo')}
          </Button>
        </>
      }
    >
      <Box ref={intro} sx={stepStyles.intro}>
        <Typography component="h1" sx={stepStyles.darkTitle}>
          {draft
            ? tLive('reviewSelfie')
            : movementPreview
              ? tLive('poseCaptured')
              : t(`titles.${phase}`)}
        </Typography>
        {remaining !== null ? (
          <Typography role="status" aria-live="assertive" aria-atomic sx={styles.countdown}>
            {tLive('captureIn', { seconds: remaining })}
          </Typography>
        ) : null}
        <Box sx={styles.segments} aria-hidden>
          {movements.map((challenge, index) => (
            <Box
              key={challenge}
              sx={styles.segment(
                index < flow.livenessStep - 1
                  ? 'done'
                  : index === flow.livenessStep - 1
                    ? 'current'
                    : 'pending',
              )}
            />
          ))}
        </Box>
      </Box>
      <Box sx={preview && !cameraFailure ? liveCaptureStyles.hiddenPreview : undefined}>
        {cameraFailure ? (
          <CameraFallback
            token={session.token}
            status={cameraStatus}
            allowGallery={false}
            onFile={() => undefined}
            onAlternative={() => flow.goTo('alternative')}
            onRetry={restartCamera}
            disabled={busy}
          />
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
      </Box>
      {preview ? (
        <Box sx={documentReviewStyles.preview}>
          <Box
            component="img"
            src={preview}
            alt={tLive(draft ? 'selfiePhoto' : 'posePhoto')}
            sx={documentReviewStyles.photoPreview}
          />
        </Box>
      ) : null}
      <Box aria-live="polite" sx={styles.hintRow}>
        <Box component="span" sx={styles.hint(ring)}>
          {draft
            ? tLive('selfieReviewHint')
            : movementPreview
              ? tLive(lastPose ? 'allPosesCaptured' : 'nextPoseHint')
              : phase === 'position'
                ? t(`framing.${framing}`, { device })
                : t(`hints.${phase}`)}
        </Box>
      </Box>
      {captureFailed ? <Alert severity="error">{tLive('captureFailed')}</Alert> : null}
      {sequence.error && !captureFailed ? <PhotoErrorNotice error={sequence.error} /> : null}
    </CaptureLayout>
  )
}
