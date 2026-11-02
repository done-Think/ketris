import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useDocumentImport } from '../hooks/use-document-import'
import { cropDocument, openDocument, pageToJpeg } from '../utils/document-import'

vi.mock('../utils/document-import', () => ({
  openDocument: vi.fn(),
  pageToJpeg: vi.fn(),
  cropDocument: vi.fn(),
}))
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal(
    'URL',
    Object.assign(class extends URL {}, {
      createObjectURL: () => 'blob:import-preview',
      revokeObjectURL: vi.fn(),
    }),
  )
  vi.mocked(openDocument).mockResolvedValue({
    pages: 2,
    renderPage: async () => document.createElement('canvas'),
    destroy: vi.fn(),
  })
  vi.mocked(pageToJpeg).mockResolvedValue(new Blob(['preview']))
  vi.mocked(cropDocument).mockResolvedValue(new Blob(['replacement']))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it.each(['front', 'back'] as const)(
  'imports only %s while retaking one side and never advances to replace another',
  async (side) => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    const file = new File(['synthetic'], 'document.jpg')
    const h = renderHook(() =>
      useDocumentImport({
        file,
        token: 'synthetic-token',
        side,
        busy: false,
        singleSide: true,
        onConfirm,
      }),
    )
    await waitFor(() => expect(h.result.current.ready).toBe(true))
    act(() => h.result.current.selectSide(side === 'front' ? 'back' : 'front'))
    expect(h.result.current.activeSide).toBe(side)
    await act(async () => {
      await h.result.current.confirm()
    })
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onConfirm).toHaveBeenCalledWith(expect.any(Blob), side)
    expect(h.result.current.activeSide).toBe(side)
    h.unmount()
  },
)
