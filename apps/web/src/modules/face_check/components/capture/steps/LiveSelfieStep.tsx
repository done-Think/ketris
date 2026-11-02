'use client'

import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { useCameraStream } from '../../../hooks/use-camera-stream'
import { useLivenessSequence } from '../../../hooks/use-liveness-sequence'
import { useCaptureSound } from '../../../hooks/use-capture-sound'
import { useSelfieFraming } from '../../../hooks/use-selfie-framing'
import { useCaptureDevice } from '../../../hooks/use-capture-device'
import type { FaceGuideGeometry } from '../../../types/face-framing.types'
import { useCaptureFlow } from '../../../stores/CaptureFlowProvider'
import type { CaptureStepProps } from '../../../types/capture.types'
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
  const mounted = useRef(false)
  const capturing = useRef(false)
  const intro = useRef<HTMLDivElement>(null)
  const device = useCaptureDevice()
  const sound = useCaptureSound()
  const list = flow.plan?.challenges ?? [...movements]
  const phase = resolveSelfiePhase(flow.livenessStep, list)
  const live = cameraStatus === 'live'
  const draft = phase === 'position' && flow.selfieImage !== null

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const sequence = useLivenessSequence({
    token: session.token,
    enabled: live && flow.livenessStep > 0 && !preparing,
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
        setCaptureFailed(false)
      } catch (error) {
        if (!signal.aborted) setCaptureFailed(true)
        throw error
      }
    },
  })
  const busy = preparing || sequence.running
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
    if (capturing.current) return
    capturing.current = true
    sound.prepare()
    setPreparing(true)
    try {
      // Keep the selfie and movements on the same video grid: the engine compares their eye distances.
      const image = await grabFrame()
      if (!mounted.current) return
      sound.play()
      flow.captureSelfie(image)
      setCaptureFailed(false)
    } catch {
      if (mounted.current) setCaptureFailed(true)
    } finally {
      capturing.current = false
      if (mounted.current) setPreparing(false)
    }
  }

  const footer =
    phase === 'position' ? (
      <>
        <Button
          size="large"
          variant="contained"
          disabled={busy || (!draft && !live)}
          onClick={draft ? () => flow.advanceLiveness(list.length) : () => void takeSelfie()}
          startIcon={preparing ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {tLive(preparing ? 'preparingPhoto' : draft ? 'confirmSelfie' : 'takeSelfie')}
        </Button>
        {draft ? (
          <Button sx={stepStyles.darkSecondaryAction} disabled={busy} onClick={flow.resetLiveness}>
            {tLive('retakeSelfie')}
          </Button>
        ) : null}
      </>
    ) : phase !== 'done' ? (
      <>
        <Typography sx={liveCaptureStyles.challengeNote}>{tLive('challengeHint')}</Typography>
        <Button
          size="large"
          variant="contained"
          disabled={!live || busy}
          onClick={() => {
            intro.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
            void sequence.start()
          }}
        >
          {sequence.remaining !== null
            ? tLive('captureIn', { seconds: sequence.remaining })
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
        <Button size="large" variant="contained" onClick={() => flow.goTo('captureReview')}>
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
          {draft ? tLive('reviewSelfie') : t(`titles.${phase}`)}
        </Typography>
        {sequence.remaining !== null ? (
          <Typography role="status" aria-live="assertive" aria-atomic sx={styles.countdown}>
            {tLive('captureIn', { seconds: sequence.remaining })}
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
      {draft ? (
        <Box sx={documentReviewStyles.preview}>
          <Box
            component="img"
            src={flow.selfiePreview!}
            alt={tLive('selfiePhoto')}
            sx={documentReviewStyles.photoPreview}
          />
        </Box>
      ) : cameraStatus !== 'live' && cameraStatus !== 'starting' ? (
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
      <Box aria-live="polite" sx={styles.hintRow}>
        <Box component="span" sx={styles.hint(ring)}>
          {draft
            ? tLive('selfieReviewHint')
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
