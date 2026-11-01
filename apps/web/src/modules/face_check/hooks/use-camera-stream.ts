import { useCallback, useEffect, useState } from 'react'

import type { CameraFacing, CameraStream, CameraStreamStatus } from '../types/capture.types'
import { attachStream, grabVideoFrame, stopStream } from '../utils/image-capture'
import { cameraConstraints, isCameraConstraintError } from '../utils/camera-constraints'

function statusForError(error: unknown): CameraStreamStatus {
  const name = error && typeof error === 'object' && 'name' in error ? error.name : null
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError')
    return 'denied'
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'notFound'
  return 'unavailable'
}

export function useCameraStream(facing: CameraFacing): CameraStream {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [failure, setFailure] = useState<CameraStreamStatus | null>(null)
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [showing, setShowing] = useState(false)

  useEffect(() => {
    let cancelled = false
    let opened: MediaStream | null = null
    let removeTrackListeners = () => {}

    async function start() {
      try {
        if (!window.isSecureContext) {
          setFailure('insecure')
          return
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          setFailure('unsupported')
          return
        }
        try {
          opened = await navigator.mediaDevices.getUserMedia(cameraConstraints(facing, true))
        } catch (error) {
          if (cancelled) return
          if (!isCameraConstraintError(error)) throw error
          // Keep lower-resolution cameras usable without retrying denied permissions.
          opened = await navigator.mediaDevices.getUserMedia(cameraConstraints(facing, false))
        }
        if (cancelled) {
          stopStream(opened)

          return
        }
        const ended = () => {
          if (!cancelled) {
            setFailure('unavailable')
            setShowing(false)
          }
        }
        opened.getVideoTracks().forEach((track) => track.addEventListener('ended', ended))
        const active = opened
        removeTrackListeners = () => {
          active.getVideoTracks().forEach((track) => track.removeEventListener('ended', ended))
        }
        setStream(opened)
      } catch (error) {
        if (!cancelled) setFailure(statusForError(error))
      }
    }

    void start()

    return () => {
      cancelled = true
      removeTrackListeners()
      stopStream(opened)
    }
  }, [facing, attempt])

  useEffect(() => attachStream(video, stream), [video, stream])

  useEffect(() => {
    if (!video) return
    const show = () => setShowing(true)
    video.addEventListener('loadeddata', show)

    return () => video.removeEventListener('loadeddata', show)
  }, [video])

  const grabFrame = useCallback(() => grabVideoFrame(video), [video])
  const restart = useCallback(() => {
    setStream(null)
    setFailure(null)
    setShowing(false)
    setAttempt((value) => value + 1)
  }, [])
  const status: CameraStreamStatus = failure ?? (stream && showing ? 'live' : 'starting')

  return { status, attachVideo: setVideo, grabFrame, restart }
}
