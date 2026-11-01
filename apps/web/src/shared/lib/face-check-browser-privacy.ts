import {
  faceCheckPrivateSelector,
  isFaceCheckTelemetryReference,
  setFaceCheckBrowserPrivacy,
} from './face-check-telemetry-privacy'

interface ReplayController {
  getRecordingMode(): 'session' | 'buffer' | undefined
  stop(options: { flush: false }): Promise<void>
  start(): void
  startBuffering(): void
}

export interface FaceCheckBrowserPrivacySdk {
  getReplay(): ReplayController | undefined
  addReplay(): void
  clearBreadcrumbs(): void
}

/** Installed before Replay so its DOM observer sees the privacy boundary before the recorder. */
export function installFaceCheckBrowserPrivacy(sdk: FaceCheckBrowserPrivacySdk) {
  let protectedPage = false
  let pendingFaceNavigation = false
  let htmlWasAlreadyBlocked = false
  let generation = 0
  let previousMode: 'session' | 'buffer' | undefined
  let stop: Promise<void> = Promise.resolve()

  function pause() {
    if (protectedPage) return
    protectedPage = true
    generation += 1
    setFaceCheckBrowserPrivacy(true)
    htmlWasAlreadyBlocked = document.documentElement.classList.contains('sentry-block')
    document.documentElement.classList.add('sentry-block')
    sdk.clearBreadcrumbs()
    const replay = sdk.getReplay()
    previousMode = replay?.getRecordingMode()
    stop = replay?.stop({ flush: false }).catch(() => undefined) ?? Promise.resolve()
  }

  async function resume() {
    if (!protectedPage) return
    const current = ++generation
    await stop
    if (
      current !== generation ||
      pendingFaceNavigation ||
      isFaceCheckTelemetryReference(window.location.href) ||
      document.querySelector(faceCheckPrivateSelector)
    )
      return
    sdk.clearBreadcrumbs()
    protectedPage = false
    if (!htmlWasAlreadyBlocked) document.documentElement.classList.remove('sentry-block')
    setFaceCheckBrowserPrivacy(false)
    const replay = sdk.getReplay()
    if (!replay) sdk.addReplay()
    else if (previousMode === 'session') replay.start()
    else if (previousMode === 'buffer') replay.startBuffering()
  }

  function sync() {
    const sensitiveDocument =
      isFaceCheckTelemetryReference(window.location.href) ||
      !!document.querySelector(faceCheckPrivateSelector)
    if (pendingFaceNavigation && !sensitiveDocument) {
      pause()
      return
    }
    if (sensitiveDocument) pendingFaceNavigation = false
    if (sensitiveDocument) pause()
    else void resume()
  }

  function transition(href: string): boolean {
    const sensitive =
      isFaceCheckTelemetryReference(href) ||
      isFaceCheckTelemetryReference(window.location.href) ||
      !!document.querySelector(faceCheckPrivateSelector)
    pendingFaceNavigation = isFaceCheckTelemetryReference(href)
    if (sensitive) pause()
    queueMicrotask(sync)
    window.requestAnimationFrame(sync)
    return sensitive
  }

  sync()
  const observer = new MutationObserver(sync)
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-face-check-private'],
  })
  window.addEventListener('popstate', sync)
  return {
    transition,
    stop: () => {
      observer.disconnect()
      window.removeEventListener('popstate', sync)
    },
  }
}
