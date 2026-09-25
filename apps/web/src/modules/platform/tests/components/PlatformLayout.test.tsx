import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import PlatformLayout from '@/app/[locale]/(platform)/platform/layout'
import { requirePlatformSession } from '@shared/lib/auth/require-platform-session'

vi.mock('@modules/platform', () => ({
  PlatformShell: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@shared/lib/auth/require-platform-session', () => ({ requirePlatformSession: vi.fn() }))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetAllMocks()
})

describe('PlatformLayout authorization', () => {
  it.each(['development', 'test', 'production'])(
    'requires a platform session in %s',
    async (environment) => {
      vi.stubEnv('NODE_ENV', environment)
      await PlatformLayout({ params: Promise.resolve({ locale: 'pt-BR' }), children: 'Protected' })
      expect(requirePlatformSession).toHaveBeenCalledTimes(1)
      expect(requirePlatformSession).toHaveBeenCalledWith('pt-BR')
    },
  )

  it('propagates the guard rejection in development before rendering the shell', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.mocked(requirePlatformSession).mockRejectedValueOnce(new Error('NEXT_REDIRECT'))
    await expect(
      PlatformLayout({ params: Promise.resolve({ locale: 'en-US' }), children: 'Protected' }),
    ).rejects.toThrow('NEXT_REDIRECT')
    expect(requirePlatformSession).toHaveBeenCalledWith('en-US')
  })
})
