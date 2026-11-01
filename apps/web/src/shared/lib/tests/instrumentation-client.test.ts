import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { installFaceCheckBrowserPrivacy } from '../face-check-browser-privacy'

const sdk = vi.hoisted(() => ({
  initialized: false,
  enabled: false,
  canEnable: true,
  constructed: false,
  replay: undefined as object | undefined,
  mode: undefined as 'session' | 'buffer' | undefined,
  controllers: [] as ReturnType<typeof installFaceCheckBrowserPrivacy>[],
  init: vi.fn(),
  addIntegration: vi.fn(),
  replayIntegration: vi.fn(),
  start: vi.fn(),
  startBuffering: vi.fn(),
  stop: vi.fn(),
  clearBreadcrumbs: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  init: sdk.init,
  isInitialized: () => sdk.initialized,
  isEnabled: () => sdk.enabled,
  getReplay: () => sdk.replay,
  addIntegration: sdk.addIntegration,
  replayIntegration: sdk.replayIntegration,
  getCurrentScope: () => ({ clearBreadcrumbs: sdk.clearBreadcrumbs }),
  getIsolationScope: () => ({ clearBreadcrumbs: sdk.clearBreadcrumbs }),
  captureRouterTransitionStart: vi.fn(),
}))

vi.mock('@shared/lib/face-check-browser-privacy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../face-check-browser-privacy')>()
  return {
    ...actual,
    installFaceCheckBrowserPrivacy: (
      ...args: Parameters<typeof actual.installFaceCheckBrowserPrivacy>
    ) => {
      const controller = actual.installFaceCheckBrowserPrivacy(...args)
      sdk.controllers.push(controller)
      return controller
    },
  }
})

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '')
  sdk.initialized = false
  sdk.enabled = false
  sdk.canEnable = true
  sdk.constructed = false
  sdk.replay = undefined
  sdk.mode = undefined
  window.history.replaceState({}, '', '/pt/dashboard')
  sdk.init.mockImplementation((options) => {
    sdk.initialized = true
    sdk.enabled = !!options.dsn && sdk.canEnable
    // A disabled Sentry client does not register the supplied integrations.
    if (sdk.enabled)
      sdk.replay = options.integrations.find(
        (integration: { name: string }) => integration.name === 'Replay',
      )
  })
  sdk.replayIntegration.mockImplementation(() => {
    // The SDK rejects a second construction even if the first was never registered.
    if (sdk.constructed)
      throw new Error('Multiple Sentry Session Replay instances are not supported')
    sdk.constructed = true
    return {
      name: 'Replay',
      getRecordingMode: () => sdk.mode,
      stop: sdk.stop,
      start: sdk.start,
      startBuffering: sdk.startBuffering,
    }
  })
  sdk.addIntegration.mockImplementation((integration) => {
    if (sdk.enabled) {
      sdk.replay = integration
      sdk.mode = 'buffer'
    }
  })
  sdk.stop.mockImplementation(async () => {
    sdk.mode = undefined
  })
  sdk.start.mockImplementation(() => {
    sdk.mode = 'session'
  })
  sdk.startBuffering.mockImplementation(() => {
    sdk.mode = 'buffer'
  })
})

afterEach(() => {
  for (const controller of sdk.controllers.splice(0)) controller.stop()
  document.body.replaceChildren()
  window.history.replaceState({}, '', '/pt/dashboard')
  vi.unstubAllEnvs()
})

async function navigate(instrumentation: typeof import('@/instrumentation-client'), path: string) {
  instrumentation.onRouterTransitionStart(path, 'push')
  window.history.replaceState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  await vi.waitFor(async () => {
    const { faceCheckBrowserPrivacyActive } = await import('../face-check-telemetry-privacy')
    expect(faceCheckBrowserPrivacyActive()).toBe(path.includes('face_check'))
  })
}

describe('browser telemetry Replay lifecycle', () => {
  it.each([false, true])(
    'does not construct Replay for a disabled SDK (DSN configured: %s)',
    async (hasDsn) => {
      if (hasDsn) vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://public@example.test/1')
      sdk.canEnable = false
      const instrumentation = await import('@/instrumentation-client')
      expect(sdk.replayIntegration).not.toHaveBeenCalled()
      for (let index = 0; index < 2; index++) {
        await navigate(instrumentation, '/pt/dashboard/face_check/my-verifications')
        await navigate(instrumentation, '/pt/dashboard')
      }
      expect(sdk.replayIntegration).not.toHaveBeenCalled()
      expect(sdk.addIntegration).not.toHaveBeenCalled()
    },
  )

  it.each(['session', 'buffer', undefined] as const)(
    'reuses Replay and restores only the previous recording mode (%s)',
    async (mode) => {
      vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://public@example.test/1')
      const instrumentation = await import('@/instrumentation-client')
      const replay = sdk.replay
      expect(replay).toBeDefined()
      expect(sdk.init.mock.invocationCallOrder[0]).toBeLessThan(
        sdk.replayIntegration.mock.invocationCallOrder[0],
      )
      sdk.mode = mode
      for (let index = 0; index < 2; index++) {
        await navigate(instrumentation, '/pt/dashboard/face_check/my-verifications')
        expect(sdk.stop).toHaveBeenLastCalledWith({ flush: false })
        await navigate(instrumentation, '/pt/dashboard')
        expect(sdk.replay).toBe(replay)
      }
      expect(sdk.replayIntegration).toHaveBeenCalledTimes(1)
      expect(sdk.addIntegration).toHaveBeenCalledTimes(1)
      expect(sdk.start).toHaveBeenCalledTimes(mode === 'session' ? 2 : 0)
      expect(sdk.startBuffering).toHaveBeenCalledTimes(mode === 'buffer' ? 2 : 0)
    },
  )

  it('defers Replay on a private entry until both navigation and private content have left', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://public@example.test/1')
    window.history.replaceState({}, '', '/pt/dashboard/face_check/my-verifications')
    const privateContent = document.createElement('section')
    privateContent.dataset.faceCheckPrivate = 'true'
    document.body.append(privateContent)
    const instrumentation = await import('@/instrumentation-client')
    expect(sdk.replayIntegration).not.toHaveBeenCalled()
    instrumentation.onRouterTransitionStart('/pt/dashboard', 'push')
    window.history.replaceState({}, '', '/pt/dashboard')
    window.dispatchEvent(new PopStateEvent('popstate'))
    await Promise.resolve()
    expect(sdk.replayIntegration).not.toHaveBeenCalled()
    privateContent.remove()
    await vi.waitFor(() => expect(sdk.replayIntegration).toHaveBeenCalledTimes(1))
    await navigate(instrumentation, '/pt/dashboard/face_check/my-verifications')
    await navigate(instrumentation, '/pt/dashboard')
    expect(sdk.replayIntegration).toHaveBeenCalledTimes(1)
  })

  it('preserves the existing client and Replay if instrumentation is evaluated again', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://public@example.test/1')
    await import('@/instrumentation-client')
    const replay = sdk.replay
    vi.resetModules()
    const instrumentation = await import('@/instrumentation-client')
    await navigate(instrumentation, '/pt/dashboard/face_check/my-verifications')
    await navigate(instrumentation, '/pt/dashboard')
    expect(sdk.init).toHaveBeenCalledTimes(1)
    expect(sdk.replayIntegration).toHaveBeenCalledTimes(1)
    expect(sdk.replay).toBe(replay)
  })
})
