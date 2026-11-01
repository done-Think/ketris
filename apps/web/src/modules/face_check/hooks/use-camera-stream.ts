import { useCallback, useEffect, useState } from 'react'

import type { CameraFacing, CameraStream, CameraStreamStatus } from '../types/capture.types'
import { attachStream, grabVideoFrame, stopStream } from '../utils/image-capture'

function statusForError(error: unknown): CameraStreamStatus {
  return error instanceof DOMException && error.name === 'NotAllowedError'
    ? 'denied'
    : 'unavailable'
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

    async function start() {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
          throw new Error('NO_CAMERA_API')
        opened = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        })
        if (cancelled) {
          stopStream(opened)

          return
        }
        setStream(opened)
      } catch (error) {
        if (!cancelled) setFailure(statusForError(error))
      }
    }

    void start()

    return () => {
      cancelled = true
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
