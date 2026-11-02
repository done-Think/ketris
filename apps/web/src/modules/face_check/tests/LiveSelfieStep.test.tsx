import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LiveSelfieStep } from '../components/capture/steps/LiveSelfieStep'
import { CapturePage } from '../components/capture/CapturePage'
import { captureService } from '../services/capture-service'
import { ApiError } from '../services/api-error'
import { CaptureFlowProvider } from '../stores/CaptureFlowProvider'
import type { CaptureSessionView } from '../types'

vi.mock('next-intl', async () => {
  const actual = await vi.importActual<typeof import('next-intl')>('next-intl')
  const messages = (await import('@/i18n/messages/pt-BR/face_check.json')).default
  return {
    ...actual,
    useTranslations: (
      namespace:
        | 'face_check.capture.selfie'
        | 'face_check.capture.live'
        | 'face_check.capture.live.issues' = 'face_check.capture.selfie',
    ) =>
      actual.createTranslator({ locale: 'pt-BR', messages: { face_check: messages }, namespace }),
  }
})
vi.mock('../services/capture-service', () => ({
  captureService: {
    getChallenges: vi.fn(),
    startLiveness: vi.fn(),
    uploadSelfie: vi.fn(),
    uploadLivenessFrame: vi.fn(),
    submit: vi.fn(),
    getSession: vi.fn(),
    requestAlternative: vi.fn(),
  },
}))
vi.mock('../hooks/use-camera-stream', () => ({
  useCameraStream: () => ({
    status: 'live',
    attachVideo: vi.fn(),
    grabFrame: async () => new Blob(['photo'], { type: 'image/jpeg' }),
  }),
}))
vi.mock('../hooks/use-capture-sound', () => ({
  useCaptureSound: () => ({ prepare: vi.fn(), play: vi.fn(), tick: vi.fn() }),
}))
vi.mock('../hooks/use-face-proximity', () => ({
  useFaceProximity: () => ({ ready: true, reset: vi.fn() }),
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
vi.mock('../components/capture/steps/ConsentStep', async () => {
  const { useEffect } = await import('react')
  const { useCaptureFlow } = await import('../stores/CaptureFlowProvider')
  return {
    ConsentStep: () => {
      const goTo = useCaptureFlow((state) => state.goTo)
      useEffect(() => goTo('selfie'), [goTo])
      return null
    },
  }
})
vi.mock('../components/capture/steps/ResultStep', () => ({
  ResultStep: () => <p>Revisão humana</p>,
}))

const session: CaptureSessionView = {
  token: 'token',
  agencyName: 'Agency',
  reference: 'Property',
  acceptedDocument: 'ANY',
  status: 'IN_PROGRESS',
  captureMode: 'camera',
  allowGalleryUpload: false,
  attemptsLeft: 3,
  maxAttempts: 3,
  expiresAt: '2026-11-08T12:00:00Z',
  redoReason: null,
}

describe('real selfie and liveness sequence', () => {
  beforeEach(() => {
    vi.mocked(captureService.startLiveness).mockResolvedValue({
      challenges: ['turnLeft', 'turnRight', 'closer'],
      step: 0,
    })
  })
  afterEach(() => vi.resetAllMocks())

  it('accepts the first selfie before fetching challenges and then captures every movement', async () => {
    const order: string[] = []
    vi.mocked(captureService.uploadSelfie).mockImplementation(async () => {
      order.push('selfie')
    })
    vi.mocked(captureService.getChallenges).mockImplementation(async () => {
      order.push('challenges')
      return ['turnLeft', 'turnRight', 'closer']
    })
    vi.mocked(captureService.uploadLivenessFrame).mockImplementation(async (_token, input) => {
      order.push(input.challenge)
      return {
        remaining: input.challenge === 'turnLeft' ? 2 : input.challenge === 'turnRight' ? 1 : 0,
      }
    })
    vi.mocked(captureService.submit).mockResolvedValue({
      status: 'PROCESSING',
      progress: 0,
      attemptsLeft: 3,
      redoReason: null,
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const user = userEvent.setup()
    const view = render(
      <QueryClientProvider client={client}>
        <CaptureFlowProvider>
          <LiveSelfieStep session={session} />
        </CaptureFlowProvider>
      </QueryClientProvider>,
    )
    expect(captureService.getChallenges).not.toHaveBeenCalled()
    const selfie = screen.getByRole('button', { name: 'Tirar selfie' })
    expect(selfie).toBeEnabled()
    await user.click(selfie)
    await waitFor(() => expect(order).toEqual(['selfie', 'challenges']))
    await user.click(await screen.findByRole('button', { name: 'Iniciar movimentos' }))
    await waitFor(() =>
      expect(order).toEqual(['selfie', 'challenges', 'turnLeft', 'turnRight', 'closer']),
    )
    await user.click(await screen.findByRole('button', { name: 'Enviar para análise' }))
    await waitFor(() => expect(captureService.submit).toHaveBeenCalledTimes(1))
    view.unmount()
    client.clear()
  })

  it('keeps human assistance available after a movement failure', async () => {
    vi.mocked(captureService.getSession).mockResolvedValue(session)
    vi.mocked(captureService.uploadSelfie).mockResolvedValue(undefined)
    vi.mocked(captureService.getChallenges).mockResolvedValue(['turnLeft', 'turnRight', 'closer'])
    vi.mocked(captureService.uploadLivenessFrame).mockRejectedValue(
      new ApiError('LIVENESS_FAILED', 422, 'livenessNotTurned'),
    )
    vi.mocked(captureService.requestAlternative).mockResolvedValue({ ...session, status: 'REVIEW' })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const user = userEvent.setup()
    const view = render(
      <QueryClientProvider client={client}>
        <CapturePage token="token" />
      </QueryClientProvider>,
    )
    await user.click(await screen.findByRole('button', { name: 'Tirar selfie' }))
    await user.click(await screen.findByRole('button', { name: 'Iniciar movimentos' }))
    expect(
      await screen.findByText(
        'Não percebemos o movimento pedido. Vire o rosto um pouco mais e tente de novo.',
      ),
    ).toBeVisible()
    const assistance = screen.getByRole('button', { name: 'Não consigo fazer este passo' })
    await waitFor(() => expect(assistance).toBeEnabled())
    await user.click(assistance)
    await user.click(
      await screen.findByRole('button', { name: 'Pedir verificação por uma pessoa' }),
    )
    await waitFor(() => expect(captureService.requestAlternative).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Pedido enviado')).toBeVisible()
    view.unmount()
    client.clear()
  })

  it('leaves the challenge and shows human review when the backend returns REVIEW', async () => {
    let review = false
    vi.mocked(captureService.getSession).mockImplementation(async () => ({
      ...session,
      status: review ? 'REVIEW' : 'IN_PROGRESS',
    }))
    vi.mocked(captureService.uploadSelfie).mockResolvedValue(undefined)
    vi.mocked(captureService.getChallenges).mockResolvedValue(['turnLeft', 'turnRight', 'closer'])
    vi.mocked(captureService.uploadLivenessFrame).mockImplementation(async () => {
      review = true
      throw new ApiError('LIVENESS_FAILED', 422, 'livenessDifferentPerson')
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const user = userEvent.setup()
    const view = render(
      <QueryClientProvider client={client}>
        <CapturePage token="token" />
      </QueryClientProvider>,
    )
    await user.click(await screen.findByRole('button', { name: 'Tirar selfie' }))
    await user.click(await screen.findByRole('button', { name: 'Iniciar movimentos' }))
    expect(await screen.findByText('Revisão humana')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Iniciar movimentos' })).not.toBeInTheDocument()
    view.unmount()
    client.clear()
  })
})
