import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LiveDocumentStep } from '../components/capture/steps/LiveDocumentStep'
import { DocumentReviewStep } from '../components/capture/steps/DocumentReviewStep'
import { captureService } from '../services/capture-service'
import { CaptureFlowProvider, useCaptureFlow } from '../stores/CaptureFlowProvider'
import type { CaptureSessionView } from '../types'

const photo = vi.fn()
const front = new Blob(['front'], { type: 'image/jpeg' })
const back = new Blob(['back'], { type: 'image/jpeg' })
const session: CaptureSessionView = {
  token: 'local-doc-review',
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

vi.mock('next-intl', async () => {
  const actual = await vi.importActual<typeof import('next-intl')>('next-intl')
  const messages = (await import('@/i18n/messages/pt-BR/face_check.json')).default
  return {
    ...actual,
    useTranslations: (namespace: 'face_check.capture.document' = 'face_check.capture.document') =>
      actual.createTranslator({ locale: 'pt-BR', messages: { face_check: messages }, namespace }),
  }
})
vi.mock('../services/capture-service', () => ({ captureService: { uploadDocumentImage: vi.fn() } }))
vi.mock('../hooks/use-camera-stream', () => ({
  useCameraStream: () => ({
    status: 'live',
    aspectRatio: 16 / 9,
    attachVideo: vi.fn(),
    grabPhoto: photo,
    restart: vi.fn(),
  }),
}))
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

function Flow() {
  const step = useCaptureFlow((state) => state.step)
  return step === 'selfie' ? (
    <p>Ready for selfie</p>
  ) : step === 'documentReview' ? (
    <DocumentReviewStep session={session} />
  ) : (
    <LiveDocumentStep session={session} />
  )
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

async function captureBoth(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Tirar foto' }))
  expect(await screen.findByRole('heading', { name: 'Verso do RG' })).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Tirar foto' }))
  expect(await screen.findByRole('heading', { name: 'Dá para ler tudo?' })).toBeVisible()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'URL',
    Object.assign(class extends URL {}, {
      createObjectURL: vi.fn(() => 'blob:photo'),
      revokeObjectURL: vi.fn(),
    }),
  )
  photo.mockResolvedValueOnce(front).mockResolvedValueOnce(back)
  vi.mocked(captureService.uploadDocumentImage).mockResolvedValue(undefined)
})
afterEach(() => {
  cleanup()
  vi.resetAllMocks()
  vi.unstubAllGlobals()
})

describe('capture, review, then confirm document photos', () => {
  it('does not upload on either shutter click, lets one side be retaken and sends both only on confirmation', async () => {
    const h = open()
    await captureBoth(h.user)
    expect(screen.getAllByRole('img')).toHaveLength(2)
    expect(captureService.uploadDocumentImage).not.toHaveBeenCalled()
    const replacement = new Blob(['better-front'], { type: 'image/jpeg' })
    photo.mockResolvedValueOnce(replacement)
    await h.user.click(screen.getAllByRole('button', { name: 'Tirar de novo' })[0])
    await h.user.click(screen.getByRole('button', { name: 'Tirar foto' }))
    expect(await screen.findByRole('heading', { name: 'Dá para ler tudo?' })).toBeVisible()
    expect(photo).toHaveBeenCalledTimes(3)
    expect(captureService.uploadDocumentImage).not.toHaveBeenCalled()
    await h.user.click(screen.getByRole('button', { name: 'Usar estas fotos' }))
    expect(await screen.findByText('Ready for selfie')).toBeVisible()
    expect(captureService.uploadDocumentImage).not.toHaveBeenCalled()
    expect(photo).toHaveBeenLastCalledWith(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
      }),
    )
    h.unmount()
    h.client.clear()
  })

  it('preserves the front when capturing the back fails locally', async () => {
    photo
      .mockReset()
      .mockResolvedValueOnce(front)
      .mockRejectedValueOnce(new Error('CAPTURE_FAILED'))
      .mockResolvedValueOnce(back)
    const h = open()
    await h.user.click(screen.getByRole('button', { name: 'Tirar foto' }))
    await screen.findByRole('heading', { name: 'Verso do RG' })
    await h.user.click(screen.getByRole('button', { name: 'Tirar foto' }))
    expect(await screen.findByText('Não conseguimos usar esta foto. Tente de novo.')).toBeVisible()
    await h.user.click(screen.getByRole('button', { name: 'Tirar foto' }))
    expect(await screen.findByRole('heading', { name: 'Dá para ler tudo?' })).toBeVisible()
    expect(captureService.uploadDocumentImage).not.toHaveBeenCalled()
    h.unmount()
    h.client.clear()
  })

  it('prevents another shutter click while the native still photo is being prepared', async () => {
    let resolve!: (image: Blob) => void
    photo.mockReset().mockImplementationOnce(
      () =>
        new Promise<Blob>((done) => {
          resolve = done
        }),
    )
    const h = open()
    await h.user.click(screen.getByRole('button', { name: 'Tirar foto' }))
    expect(screen.getByRole('button', { name: 'Tirar foto' })).toBeDisabled()
    expect(photo).toHaveBeenCalledOnce()
    resolve(front)
    await screen.findByRole('heading', { name: 'Verso do RG' })
    expect(captureService.uploadDocumentImage).not.toHaveBeenCalled()
    h.unmount()
    h.client.clear()
  })
})
