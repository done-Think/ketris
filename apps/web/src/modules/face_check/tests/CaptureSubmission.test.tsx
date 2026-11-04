import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CaptureFlowProvider } from '../stores/CaptureFlowProvider'
import { useSubmitCaptureDrafts } from '../hooks/use-submit-capture-drafts'
import { captureService } from '../services/capture-service'
import { ApiError } from '../services/api-error'
import { SubmitStep } from '../components/capture/steps/SubmitStep'
import type { CaptureSessionView } from '../types'

vi.mock('../services/capture-service', () => ({
  captureService: {
    getStatus: vi.fn(),
    uploadDocumentImage: vi.fn(),
    uploadSelfie: vi.fn(),
    startLiveness: vi.fn(),
    uploadLivenessFrame: vi.fn(),
    submit: vi.fn(),
  },
}))
vi.mock('../components/capture/CaptureLayout', () => ({
  CaptureLayout: ({ children, footer }: { children: ReactNode; footer?: ReactNode }) => (
    <main>
      {children}
      {footer}
    </main>
  ),
}))
vi.mock('@/i18n/navigation', async () => {
  const { forwardRef } = await import('react')
  return {
    Link: forwardRef<HTMLAnchorElement, { children: ReactNode; href: string }>(function TestLink(
      { children, ...props },
      ref,
    ) {
      return (
        <a {...props} ref={ref}>
          {children}
        </a>
      )
    }),
  }
})

const receipt = { status: 'PROCESSING' as const, progress: 8, attemptsLeft: 2, redoReason: null }
const challenges = ['turnLeft', 'turnRight', 'closer'] as const
const draft = () => ({
  documentType: 'RG' as const,
  documentImages: { front: new Blob(['front']), back: new Blob(['back']) },
  selfieImage: new Blob(['selfie']),
  movementImages: Object.fromEntries(challenges.map((pose) => [pose, new Blob([pose])])),
  plan: {
    planId: '11111111-1111-4111-8111-111111111111',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    challenges: [...challenges],
    step: 0,
  },
  uploaded: {},
})
function open() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const hook = renderHook(() => useSubmitCaptureDrafts('token'), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>
        <CaptureFlowProvider>{children}</CaptureFlowProvider>
      </QueryClientProvider>
    ),
  })
  return { ...hook, client }
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(captureService.getStatus).mockResolvedValue({ ...receipt, status: 'IN_PROGRESS' })
  vi.mocked(captureService.uploadDocumentImage).mockResolvedValue(undefined)
  vi.mocked(captureService.uploadSelfie).mockResolvedValue(undefined)
  vi.mocked(captureService.startLiveness).mockResolvedValue({
    challenges: [...challenges],
    step: 0,
  })
  vi.mocked(captureService.uploadLivenessFrame).mockImplementation(async (_token, input) => ({
    remaining:
      challenges.length - challenges.indexOf(input.challenge as (typeof challenges)[number]) - 1,
  }))
  vi.mocked(captureService.submit).mockResolvedValue(receipt)
})
afterEach(() => cleanup())

describe('one-time capture submission', () => {
  it('finishes after receipt without awaiting the analysis and uploads the six images once', async () => {
    const h = open()
    await act(async () => {
      await expect(h.result.current.mutateAsync(draft())).resolves.toEqual(receipt)
    })
    expect(captureService.uploadDocumentImage).toHaveBeenCalledTimes(2)
    expect(captureService.uploadSelfie).toHaveBeenCalledTimes(1)
    expect(captureService.uploadLivenessFrame).toHaveBeenCalledTimes(3)
    expect(captureService.submit).toHaveBeenCalledTimes(1)
    expect(h.result.current.isSuccess).toBe(true)
    h.unmount()
    h.client.clear()
  })

  it('recovers a lost final acknowledgement without presenting another upload as necessary', async () => {
    vi.mocked(captureService.submit).mockRejectedValueOnce(new ApiError('NETWORK_ERROR', 0))
    vi.mocked(captureService.getStatus)
      .mockResolvedValueOnce({ ...receipt, status: 'IN_PROGRESS' })
      .mockResolvedValueOnce(receipt)
    const h = open()
    await act(async () => {
      await expect(h.result.current.mutateAsync(draft())).resolves.toEqual(receipt)
    })
    expect(h.result.current.error).toBeNull()
    expect(captureService.submit).toHaveBeenCalledTimes(1)
    expect(captureService.uploadDocumentImage).toHaveBeenCalledTimes(2)
    h.unmount()
    h.client.clear()
  })

  it('does not upload again when the server already received the submission', async () => {
    vi.mocked(captureService.getStatus).mockResolvedValue(receipt)
    const h = open()
    await act(async () => {
      await h.result.current.mutateAsync(draft())
    })
    expect(captureService.uploadDocumentImage).not.toHaveBeenCalled()
    expect(captureService.submit).not.toHaveBeenCalled()
    h.unmount()
    h.client.clear()
  })

  it('does not report successful receipt for an expired capture', async () => {
    vi.mocked(captureService.getStatus).mockResolvedValue({ ...receipt, status: 'EXPIRED' })
    const h = open()
    await act(async () => {
      await expect(h.result.current.mutateAsync(draft())).rejects.toMatchObject({
        code: 'SESSION_EXPIRED',
      })
    })
    expect(captureService.uploadDocumentImage).not.toHaveBeenCalled()
    h.unmount()
    h.client.clear()
  })

  it('shows confirmation and allows leaving while the team processes the images', () => {
    const session = {
      token: 'token',
      captureMode: 'camera',
      agencyName: 'Agência Teste',
      status: 'PROCESSING',
    } as CaptureSessionView
    render(<SubmitStep session={session} />)
    expect(screen.getByRole('heading', { name: 'Fotos enviadas com sucesso' })).toBeVisible()
    expect(screen.getByText(/Não é necessário enviar as fotos novamente/)).toBeVisible()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /enviar/i })).not.toBeInTheDocument()
  })
})
