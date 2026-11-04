import { useCallback, useEffect, useState } from 'react'

import type { CameraFacing, CameraStream, CameraStreamStatus } from '../types/capture.types'
import { attachStream, grabPreviewFrame, grabVideoFrame, stopStream } from '../utils/image-capture'
import { cameraConstraints, isCameraConstraintError } from '../utils/camera-constraints'
import { configureCameraQuality } from '../utils/camera-quality'
import { grabCameraPhoto } from '../utils/camera-photo'
import type { NormalizedImageCrop } from '../types/image-crop.types'

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
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

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
        const track = opened.getVideoTracks()[0]
        if (track) await configureCameraQuality(track)
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
    const measure = () => {
      setAspectRatio(
        video.videoWidth > 0 && video.videoHeight > 0 ? video.videoWidth / video.videoHeight : null,
      )
    }
    const show = () => {
      measure()
      setShowing(true)
    }
    measure()
    video.addEventListener('loadedmetadata', measure)
    video.addEventListener('resize', measure)
    video.addEventListener('loadeddata', show)

    return () => {
      video.removeEventListener('loadedmetadata', measure)
      video.removeEventListener('resize', measure)
      video.removeEventListener('loadeddata', show)
    }
  }, [video])

  const grabFrame = useCallback(() => grabVideoFrame(video), [video])
  const grabPhoto = useCallback(
    (crop?: NormalizedImageCrop) => grabCameraPhoto(video, stream, crop),
    [video, stream],
  )
  const sampleFrame = useCallback(() => grabPreviewFrame(video), [video])
  const restart = useCallback(() => {
    setStream(null)
    setFailure(null)
    setShowing(false)
    setAspectRatio(null)
    setAttempt((value) => value + 1)
  }, [])
  const status: CameraStreamStatus = failure ?? (stream && showing ? 'live' : 'starting')

  return { status, aspectRatio, attachVideo: setVideo, grabFrame, grabPhoto, sampleFrame, restart }
}
