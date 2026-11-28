import { afterEach, describe, expect, it, vi } from 'vitest'

import { shareLink } from '../../utils/share-link'

const input = { title: 'Apartamento Localizado', url: 'https://ketris.test/pt/imoveis/property-1' }

function mockEnvironment({
  touch,
  share,
  writeText = vi.fn().mockResolvedValue(undefined),
}: {
  touch: boolean
  share?: ReturnType<typeof vi.fn>
  writeText?: ReturnType<typeof vi.fn>
}) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: touch }))
  Object.defineProperty(navigator, 'share', { configurable: true, value: share })
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  return { share, writeText }
}

afterEach(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
})

describe('shareLink', () => {
  it('opens the native share sheet on touch devices', async () => {
    const { share, writeText } = mockEnvironment({
      touch: true,
      share: vi.fn().mockResolvedValue(undefined),
    })

    await expect(shareLink(input)).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith(input)
    expect(writeText).not.toHaveBeenCalled()
  })

  it('copies the link on desktop even when the browser can share', async () => {
    const { share, writeText } = mockEnvironment({ touch: false, share: vi.fn() })

    await expect(shareLink(input)).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith(input.url)
    expect(share).not.toHaveBeenCalled()
  })

  it('does nothing else when the person closes the share sheet', async () => {
    const { writeText } = mockEnvironment({
      touch: true,
      share: vi.fn().mockRejectedValue(new DOMException('closed', 'AbortError')),
    })

    await expect(shareLink(input)).resolves.toBe('cancelled')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('falls back to copying when the share sheet fails', async () => {
    const { writeText } = mockEnvironment({
      touch: true,
      share: vi.fn().mockRejectedValue(new DOMException('blocked', 'NotAllowedError')),
    })

    await expect(shareLink(input)).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith(input.url)
  })

  it('reports a failure when the link cannot be copied', async () => {
    mockEnvironment({ touch: false, writeText: vi.fn().mockRejectedValue(new Error('denied')) })

    await expect(shareLink(input)).resolves.toBe('failed')
  })
})
