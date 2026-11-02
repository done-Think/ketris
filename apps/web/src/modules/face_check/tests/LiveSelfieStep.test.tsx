import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LiveSelfieStep } from '../components/capture/steps/LiveSelfieStep'
import { CaptureReviewStep } from '../components/capture/steps/CaptureReviewStep'
import { LiveDocumentStep } from '../components/capture/steps/LiveDocumentStep'
import { DocumentReviewStep } from '../components/capture/steps/DocumentReviewStep'
import { captureService } from '../services/capture-service'
import { ApiError } from '../services/api-error'
import { CaptureFlowProvider, useCaptureFlow } from '../stores/CaptureFlowProvider'
import type { CaptureSessionView } from '../types'

const timing = vi.hoisted(() => ({ fast: true }))
const grab = vi.hoisted(() => vi.fn())
const documentPhoto = vi.hoisted(() => vi.fn())

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
    aspectRatio: 16 / 9,
    attachVideo: vi.fn(),
    grabFrame: grab,
    grabPhoto: documentPhoto,
  }),
}))
vi.mock('../hooks/use-selfie-framing', () => ({ useSelfieFraming: () => 'ready' }))
vi.mock('../hooks/use-capture-sound', () => ({
  useCaptureSound: () => ({ prepare: vi.fn(), play: vi.fn(), tick: vi.fn() }),
}))
vi.mock('../hooks/use-countdown', async () => {
  const actual =
    await vi.importActual<typeof import('../hooks/use-countdown')>('../hooks/use-countdown')
  return {
    useCountdown: (seconds: number) => {
      const countdown = actual.useCountdown(seconds)
      return timing.fast
        ? { ...countdown, run: async (_signal: AbortSignal, tick: () => void) => tick() }
        : countdown
    },
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
vi.mock('../components/capture/ContinueOnPhoneButton', () => ({
  ContinueOnPhoneButton: () => null,
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
  if (flow.step === 'document') return <LiveDocumentStep session={session} />
  if (flow.step === 'documentReview') return <DocumentReviewStep session={session} />
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
async function nextPose(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => expect(screen.getByRole('button', { name: 'Próximo' })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: 'Próximo' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Capturar foto' })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: 'Capturar foto' }))
}
async function captureAll(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Tirar selfie' }))
  expect(captureService.uploadSelfie).not.toHaveBeenCalled()
  await nextPose(user)
  await nextPose(user)
  await nextPose(user)
  await user.click(await screen.findByRole('button', { name: 'Revisar todas as fotos' }))
}

beforeEach(() => {
  vi.resetAllMocks()
  timing.fast = true
  grab.mockResolvedValue(new Blob(['frame'], { type: 'image/jpeg' }))
  documentPhoto.mockResolvedValue(new Blob(['new-document'], { type: 'image/jpeg' }))
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
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('deferred selfie and movement capture', () => {
  it.each([
    [2, 'Tirar selfie'],
    [3, 'Capturar foto'],
    [4, 'Capturar foto'],
    [5, 'Capturar foto'],
  ] as const)(
    'keeps all six images when photo %s is paused during its countdown and cancelled',
    async (index, button) => {
      const h = open()
      await captureAll(h.user)
      const originals = screen.getAllByRole('img').map((img) => img.getAttribute('src'))
      timing.fast = false
      vi.useFakeTimers()
      fireEvent.click(screen.getAllByRole('button', { name: 'Refazer captura' })[index])
      fireEvent.click(screen.getByRole('button', { name: button }))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })
      fireEvent.click(screen.getByRole('button', { name: 'Pausar captura' }))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000)
      })
      fireEvent.click(screen.getByRole('button', { name: 'Manter foto anterior' }))
      expect(screen.getAllByRole('img').map((img) => img.getAttribute('src'))).toEqual(originals)
      expect(grab).toHaveBeenCalledTimes(4)
      expect(URL.revokeObjectURL).not.toHaveBeenCalled()
      h.unmount()
      h.client.clear()
    },
  )

  it.each([
    [0, 'front', 'Tirar foto'],
    [1, 'back', 'Tirar foto'],
    [2, 'selfie', 'Tirar selfie'],
    [3, 'turnLeft', 'Capturar foto'],
    [4, 'turnRight', 'Capturar foto'],
    [5, 'closer', 'Capturar foto'],
  ] as const)(
    'retakes only photo %s (%s), preserving all other preview URLs',
    async (index, _slot, button) => {
      const h = open()
      await captureAll(h.user)
      const originals = screen.getAllByRole('img').map((img) => img.getAttribute('src'))
      await h.user.click(screen.getAllByRole('button', { name: 'Refazer captura' })[index])
      await h.user.click(await screen.findByRole('button', { name: button }))
      expect(
        await screen.findByRole('button', { name: 'Confirmar e enviar para análise' }),
      ).toBeEnabled()
      const updated = screen.getAllByRole('img').map((img) => img.getAttribute('src'))
      expect(updated).toHaveLength(6)
      for (let item = 0; item < originals.length; item++) {
        if (item === index) expect(updated[item]).not.toBe(originals[item])
        else expect(updated[item]).toBe(originals[item])
      }
      expect(captureService.uploadDocumentImage).not.toHaveBeenCalled()
      expect(captureService.uploadSelfie).not.toHaveBeenCalled()
      expect(captureService.uploadLivenessFrame).not.toHaveBeenCalled()
      h.unmount()
      h.client.clear()
    },
  )

  it.each([
    [0, 'front', 'Tirar foto'],
    [1, 'back', 'Tirar foto'],
    [2, 'selfie', 'Tirar selfie'],
    [3, 'turnLeft', 'Capturar foto'],
    [4, 'turnRight', 'Capturar foto'],
    [5, 'closer', 'Capturar foto'],
  ] as const)(
    'keeps all original photos when retaking %s (%s) fails and is cancelled',
    async (index, slot, button) => {
      const h = open()
      await captureAll(h.user)
      const originals = screen.getAllByRole('img').map((img) => img.getAttribute('src'))
      if (slot === 'front' || slot === 'back')
        documentPhoto.mockRejectedValueOnce(new Error('CAMERA_ERROR'))
      else grab.mockRejectedValueOnce(new Error('CAMERA_ERROR'))
      await h.user.click(screen.getAllByRole('button', { name: 'Refazer captura' })[index])
      await h.user.click(await screen.findByRole('button', { name: button }))
      await screen.findByText('Não conseguimos usar esta foto. Tente de novo.')
      await h.user.click(screen.getByRole('button', { name: 'Manter foto anterior' }))
      expect(
        await screen.findByRole('button', { name: 'Confirmar e enviar para análise' }),
      ).toBeEnabled()
      expect(screen.getAllByRole('img').map((img) => img.getAttribute('src'))).toEqual(originals)
      expect(URL.revokeObjectURL).not.toHaveBeenCalled()
      h.unmount()
      h.client.clear()
    },
  )

  it('retakes only a rejected back, returns directly to final review and preserves the accepted front receipt', async () => {
    let rejected = false
    vi.mocked(captureService.uploadDocumentImage).mockImplementation(async (_token, input) => {
      if (input.side === 'back' && !rejected) {
        rejected = true
        throw new ApiError('PHOTO_REJECTED', 422, 'documentTextNotFound')
      }
    })
    const h = open()
    await captureAll(h.user)
    await h.user.click(screen.getByRole('button', { name: 'Confirmar e enviar para análise' }))
    await screen.findByText(/Não foi possível validar: Verso do documento/)
    await h.user.click(screen.getAllByRole('button', { name: 'Refazer captura' })[1])
    expect(await screen.findByRole('heading', { name: 'Verso do RG' })).toBeVisible()
    expect(grab).toHaveBeenCalledTimes(4)
    await h.user.click(screen.getByRole('button', { name: 'Tirar foto' }))
    expect(
      await screen.findByRole('button', { name: 'Confirmar e enviar para análise' }),
    ).toBeEnabled()
    expect(screen.getAllByRole('img')).toHaveLength(6)
    expect(grab).toHaveBeenCalledTimes(4)
    await h.user.click(screen.getByRole('button', { name: 'Confirmar e enviar para análise' }))
    expect(await screen.findByText('Capture submitted')).toBeVisible()
    expect(
      vi.mocked(captureService.uploadDocumentImage).mock.calls.map(([, input]) => input.side),
    ).toEqual(['front', 'back', 'back'])
    expect(captureService.uploadSelfie).toHaveBeenCalledOnce()
    expect(documentPhoto).toHaveBeenCalledOnce()
    h.unmount()
    h.client.clear()
  })

  it.each(['selfie', 'submit'] as const)(
    'revalidates existing local selfies under a new plan after a lost %s acknowledgement and a document edit',
    async (stage) => {
      if (stage === 'selfie')
        vi.mocked(captureService.uploadSelfie).mockRejectedValueOnce(
          new ApiError('NETWORK_ERROR', 0),
        )
      else vi.mocked(captureService.submit).mockRejectedValueOnce(new ApiError('NETWORK_ERROR', 0))
      const h = open()
      await captureAll(h.user)
      await h.user.click(screen.getByRole('button', { name: 'Confirmar e enviar para análise' }))
      await screen.findByText(
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      )
      const originalSelfie = vi.mocked(captureService.uploadSelfie).mock.calls[0][1]
      await h.user.click(screen.getAllByRole('button', { name: 'Refazer captura' })[1])
      await h.user.click(await screen.findByRole('button', { name: 'Tirar foto' }))
      expect(
        await screen.findByRole('button', { name: 'Confirmar e enviar para análise' }),
      ).toBeEnabled()
      const newPlan = { ...plan, planId: '22222222-2222-4222-8222-222222222222' }
      vi.mocked(captureService.prepareLiveness).mockResolvedValue(newPlan)
      await h.user.click(screen.getByRole('button', { name: 'Confirmar e enviar para análise' }))
      expect(await screen.findByText('Capture submitted')).toBeVisible()
      expect(captureService.prepareLiveness).toHaveBeenLastCalledWith(
        'token',
        true,
        expect.any(AbortSignal),
      )
      expect(captureService.uploadSelfie).toHaveBeenLastCalledWith(
        'token',
        originalSelfie,
        expect.any(AbortSignal),
        newPlan.planId,
      )
      expect(grab).toHaveBeenCalledTimes(4)
      h.unmount()
      h.client.clear()
    },
  )

  it('keeps all six photos local until final confirmation, then submits in server-validated order', async () => {
    const h = open()
    await captureAll(h.user)
    expect(screen.getAllByRole('img')).toHaveLength(6)
    expect(captureService.uploadDocumentImage).not.toHaveBeenCalled()
    expect(captureService.uploadSelfie).not.toHaveBeenCalled()
    expect(captureService.uploadLivenessFrame).not.toHaveBeenCalled()
    expect(captureService.submit).not.toHaveBeenCalled()
    expect(captureService.prepareLiveness).toHaveBeenCalledTimes(6)
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
    const first = screen
      .getByRole('img', { name: 'Selfie capturada para revisão' })
      .getAttribute('src')
    await h.user.click(screen.getByRole('button', { name: 'Tirar selfie de novo' }))
    expect(
      screen.queryByRole('img', { name: 'Selfie capturada para revisão' }),
    ).not.toBeInTheDocument()
    await h.user.click(screen.getByRole('button', { name: 'Tirar selfie' }))
    expect(screen.getByRole('img', { name: 'Selfie capturada para revisão' })).not.toHaveAttribute(
      'src',
      first,
    )
    expect(captureService.uploadSelfie).not.toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
    h.unmount()
    h.client.clear()
  })

  it('retakes only a rejected right turn and revalidates the retained set against a new server checkpoint', async () => {
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
    vi.mocked(captureService.prepareLiveness).mockResolvedValue({
      ...plan,
      planId: '22222222-2222-4222-8222-222222222222',
    })
    vi.mocked(captureService.startLiveness).mockResolvedValue({
      challenges: [...challenges],
      step: 0,
    })
    await h.user.click(screen.getAllByRole('button', { name: 'Refazer captura' })[4])
    await h.user.click(await screen.findByRole('button', { name: 'Capturar foto' }))
    await h.user.click(
      await screen.findByRole('button', { name: 'Confirmar e enviar para análise' }),
    )
    expect(await screen.findByText('Capture submitted')).toBeVisible()
    expect(sent).toEqual(['turnLeft', 'turnRight', 'turnLeft', 'turnRight', 'closer'])
    expect(captureService.uploadDocumentImage).toHaveBeenCalledTimes(4)
    expect(captureService.uploadSelfie).toHaveBeenCalledTimes(2)
    expect(grab).toHaveBeenCalledTimes(5)
    h.unmount()
    h.client.clear()
  })

  it('lets users read each next pose indefinitely and starts its three seconds only on Capture', async () => {
    timing.fast = false
    vi.useFakeTimers()
    const h = open()
    const advance = async (ms: number) =>
      act(async () => {
        await vi.advanceTimersByTimeAsync(ms)
      })
    await advance(30_000)
    expect(grab).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Tirar selfie' }))
    await advance(2999)
    expect(grab).not.toHaveBeenCalled()
    await advance(1)
    expect(grab).toHaveBeenCalledTimes(1)
    for (let count = 2; count <= 4; count++) {
      await advance(30_000)
      expect(grab).toHaveBeenCalledTimes(count - 1)
      fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
      await advance(30_000)
      expect(grab).toHaveBeenCalledTimes(count - 1)
      expect(screen.queryByRole('button', { name: /Captura em/ })).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Capturar foto' }))
      await advance(2999)
      expect(grab).toHaveBeenCalledTimes(count - 1)
      await advance(1)
      expect(grab).toHaveBeenCalledTimes(count)
    }
    await advance(30_000)
    expect(grab).toHaveBeenCalledTimes(4)
    expect(screen.getByRole('button', { name: 'Revisar todas as fotos' })).toBeVisible()
    expect(captureService.uploadSelfie).not.toHaveBeenCalled()
    expect(captureService.uploadLivenessFrame).not.toHaveBeenCalled()
    expect(captureService.submit).not.toHaveBeenCalled()
    h.unmount()
    h.client.clear()
  })

  it.each(['pause', 'hidden', 'unmount'])(
    'cancels the selfie countdown on %s and waits for a fresh click',
    async (reason) => {
      timing.fast = false
      vi.useFakeTimers()
      const h = open()
      const advance = async (ms: number) =>
        act(async () => {
          await vi.advanceTimersByTimeAsync(ms)
        })
      fireEvent.click(screen.getByRole('button', { name: 'Tirar selfie' }))
      await advance(1000)
      if (reason === 'pause')
        fireEvent.click(screen.getByRole('button', { name: 'Pausar captura' }))
      if (reason === 'hidden') {
        vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
        fireEvent(document, new Event('visibilitychange'))
      }
      if (reason === 'unmount') h.unmount()
      await advance(30_000)
      expect(grab).not.toHaveBeenCalled()
      if (reason === 'hidden') {
        vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
        fireEvent(document, new Event('visibilitychange'))
        await advance(30_000)
        expect(grab).not.toHaveBeenCalled()
      }
      if (reason !== 'unmount') {
        fireEvent.click(screen.getByRole('button', { name: 'Tirar selfie' }))
        await advance(3000)
        expect(grab).toHaveBeenCalledOnce()
      }
      h.unmount()
      h.client.clear()
    },
  )
})
