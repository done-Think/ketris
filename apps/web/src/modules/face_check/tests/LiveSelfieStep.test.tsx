import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LiveSelfieStep } from '../components/capture/steps/LiveSelfieStep'
import { CaptureReviewStep } from '../components/capture/steps/CaptureReviewStep'
import { captureService } from '../services/capture-service'
import { ApiError } from '../services/api-error'
import { CaptureFlowProvider, useCaptureFlow } from '../stores/CaptureFlowProvider'
import type { CaptureSessionView } from '../types'

vi.mock('../services/capture-service', () => ({
  captureService: {
    prepareLiveness: vi.fn(),
    startLiveness: vi.fn(),
    uploadDocumentImage: vi.fn(),
    uploadSelfie: vi.fn(),
    uploadLivenessFrame: vi.fn(),
    submit: vi.fn(),
    getStatus: vi.fn(),
  },
}))
vi.mock('../hooks/use-camera-stream', () => ({
  useCameraStream: () => ({
    status: 'live',
    attachVideo: vi.fn(),
    grabFrame: async () => new Blob(['frame'], { type: 'image/jpeg' }),
    grabPhoto: async () => new Blob(['native-selfie'], { type: 'image/jpeg' }),
  }),
}))
vi.mock('../hooks/use-selfie-framing', () => ({ useSelfieFraming: () => 'ready' }))
vi.mock('../hooks/use-capture-sound', () => ({
  useCaptureSound: () => ({ prepare: vi.fn(), play: vi.fn(), tick: vi.fn() }),
}))
vi.mock('../hooks/use-countdown', () => {
  const clear = vi.fn()
  return {
    useCountdown: () => ({
      remaining: null,
      run: async (_signal: AbortSignal, tick: () => void) => tick(),
      clear,
    }),
  }
})
vi.mock('../components/capture/CaptureLayout', () => ({
  CaptureLayout: ({ children, footer }: { children: ReactNode; footer?: ReactNode }) => (
    <main>
      {children}
      {footer}
    </main>
  ),
}))

const challenges = ['turnLeft', 'turnRight', 'closer'] as const
const plan = {
  planId: '11111111-1111-4111-8111-111111111111',
  expiresAt: '2099-11-01T12:00:00Z',
  challenges: [...challenges],
  step: 0,
}
const session: CaptureSessionView = {
  token: 'token',
  agencyName: 'Agency',
  reference: 'Property',
  acceptedDocument: 'RG',
  status: 'IN_PROGRESS',
  captureMode: 'camera',
  allowGalleryUpload: false,
  attemptsLeft: 3,
  maxAttempts: 3,
  expiresAt: '2099-11-08T12:00:00Z',
  redoReason: null,
}

function Flow() {
  const flow = useCaptureFlow((state) => state)
  const [ready, setReady] = useState(false)
  const { chooseDocument, captureDocument, goTo } = flow
  useEffect(() => {
    chooseDocument('RG')
    captureDocument('front', new Blob(['front']))
    captureDocument('back', new Blob(['back']))
    goTo('selfie')
    setReady(true)
  }, [chooseDocument, captureDocument, goTo])
  if (!ready) return null
  if (flow.step === 'submit') return <p>Capture submitted</p>
  if (flow.step === 'captureReview') return <CaptureReviewStep session={session} />
  return <LiveSelfieStep session={session} />
}
function open() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={client}>
      <CaptureFlowProvider>
        <Flow />
      </CaptureFlowProvider>
    </QueryClientProvider>,
  )
  return { ...view, client, user: userEvent.setup() }
}
async function captureAll(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Tirar selfie' }))
  expect(captureService.uploadSelfie).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Usar esta selfie' }))
  await user.click(await screen.findByRole('button', { name: 'Iniciar movimentos' }))
  await user.click(await screen.findByRole('button', { name: 'Revisar todas as fotos' }))
}

beforeEach(() => {
  vi.resetAllMocks()
  let id = 0
  vi.stubGlobal(
    'URL',
    Object.assign(class extends URL {}, {
      createObjectURL: vi.fn(() => `blob:photo-${++id}`),
      revokeObjectURL: vi.fn(),
    }),
  )
  vi.mocked(captureService.prepareLiveness).mockResolvedValue(plan)
  vi.mocked(captureService.startLiveness).mockResolvedValue({
    challenges: [...challenges],
    step: 0,
  })
  vi.mocked(captureService.getStatus).mockResolvedValue({
    status: 'IN_PROGRESS',
    progress: 0,
    attemptsLeft: 3,
    redoReason: null,
  })
  vi.mocked(captureService.uploadDocumentImage).mockResolvedValue(undefined)
  vi.mocked(captureService.uploadSelfie).mockResolvedValue(undefined)
  vi.mocked(captureService.uploadLivenessFrame).mockImplementation(async (_token, input) => ({
    remaining: 2 - challenges.indexOf(input.challenge as (typeof challenges)[number]),
  }))
  vi.mocked(captureService.submit).mockResolvedValue({
    status: 'PROCESSING',
    progress: 0,
    attemptsLeft: 3,
    redoReason: null,
  })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('deferred selfie and movement capture', () => {
  it('keeps all six photos local until final confirmation, then submits in server-validated order', async () => {
    const h = open()
    await captureAll(h.user)
    expect(screen.getAllByRole('img')).toHaveLength(6)
    expect(captureService.uploadDocumentImage).not.toHaveBeenCalled()
    expect(captureService.uploadSelfie).not.toHaveBeenCalled()
    expect(captureService.uploadLivenessFrame).not.toHaveBeenCalled()
    expect(captureService.submit).not.toHaveBeenCalled()
    expect(captureService.prepareLiveness).toHaveBeenCalledOnce()
    await h.user.click(screen.getByRole('button', { name: 'Confirmar e enviar para análise' }))
    expect(await screen.findByText('Capture submitted')).toBeVisible()
    expect(
      vi.mocked(captureService.uploadDocumentImage).mock.calls.map(([, input]) => input.side),
    ).toEqual(['front', 'back'])
    expect(
      vi.mocked(captureService.uploadLivenessFrame).mock.calls.map(([, input]) => input.challenge),
    ).toEqual([...challenges])
    expect(captureService.uploadSelfie).toHaveBeenCalledWith(
      'token',
      expect.any(Blob),
      expect.any(AbortSignal),
      plan.planId,
    )
    expect(captureService.submit).toHaveBeenCalledWith(
      'token',
      expect.any(AbortSignal),
      plan.planId,
    )
    h.unmount()
    h.client.clear()
  })

  it('retakes an unconfirmed selfie without uploading the discarded photo', async () => {
    const h = open()
    await h.user.click(await screen.findByRole('button', { name: 'Tirar selfie' }))
    await h.user.click(screen.getByRole('button', { name: 'Tirar selfie de novo' }))
    expect(screen.getByRole('button', { name: 'Tirar selfie' })).toBeVisible()
    expect(captureService.uploadSelfie).not.toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
    h.unmount()
    h.client.clear()
  })

  it('resumes a rejected right turn without re-uploading accepted photos or repeating left', async () => {
    let rejected = false
    const sent: string[] = []
    vi.mocked(captureService.uploadLivenessFrame).mockImplementation(async (_token, input) => {
      sent.push(input.challenge)
      if (input.challenge === 'turnRight' && !rejected) {
        rejected = true
        throw new ApiError('LIVENESS_FAILED', 422, 'livenessNotTurned')
      }
      return { remaining: 2 - challenges.indexOf(input.challenge as (typeof challenges)[number]) }
    })
    const h = open()
    await captureAll(h.user)
    await h.user.click(screen.getByRole('button', { name: 'Confirmar e enviar para análise' }))
    expect(await screen.findByText(/Não foi possível validar: Rosto para a direita/)).toBeVisible()
    vi.mocked(captureService.prepareLiveness).mockResolvedValue({ ...plan, step: 1 })
    vi.mocked(captureService.startLiveness).mockResolvedValue({
      challenges: [...challenges],
      step: 1,
    })
    await h.user.click(screen.getAllByRole('button', { name: 'Refazer captura' })[4])
    await h.user.click(await screen.findByRole('button', { name: 'Iniciar movimentos' }))
    await h.user.click(await screen.findByRole('button', { name: 'Revisar todas as fotos' }))
    await h.user.click(screen.getByRole('button', { name: 'Confirmar e enviar para análise' }))
    expect(await screen.findByText('Capture submitted')).toBeVisible()
    expect(sent).toEqual(['turnLeft', 'turnRight', 'turnRight', 'closer'])
    expect(captureService.uploadDocumentImage).toHaveBeenCalledTimes(2)
    expect(captureService.uploadSelfie).toHaveBeenCalledOnce()
    h.unmount()
    h.client.clear()
  })
})
