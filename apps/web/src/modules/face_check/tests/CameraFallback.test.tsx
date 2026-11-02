import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { CameraFallback } from '../components/capture/CameraFallback'
import { phoneCaptureUrl } from '../utils/phone-capture-url'

vi.mock('../utils/phone-capture-url', () => ({ phoneCaptureUrl: vi.fn() }))
const url = `https://ketris.example/pt/face_check/verify/${'a'.repeat(64)}`
const props = {
  token: 'a'.repeat(64),
  allowGallery: false,
  onFile: vi.fn(),
  onAlternative: vi.fn(),
  onRetry: vi.fn(),
}
afterEach(() => vi.clearAllMocks())

it('guides a device without a webcam to the same verification on a phone', async () => {
  vi.mocked(phoneCaptureUrl).mockReturnValue(url)
  const user = userEvent.setup()
  render(<CameraFallback {...props} status="notFound" />)
  expect(screen.getByText('Nenhuma câmera encontrada neste dispositivo')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Continuar pelo celular' }))
  expect(screen.getByRole('dialog').closest('[data-face-check-private]')).toHaveAttribute(
    'data-face-check-private',
    'true',
  )
  expect(
    screen.getByRole('img', { name: 'QR code para abrir esta verificação no celular' }),
  ).toBeVisible()
  expect(screen.getByRole('textbox', { name: 'Link desta verificação' })).toHaveValue(url)
  expect(screen.getByText(/Este link é pessoal/)).toBeVisible()
})

it('explains denied permission and retries only at the user’s request', async () => {
  const user = userEvent.setup()
  render(<CameraFallback {...props} status="denied" />)
  expect(screen.getByText('A câmera foi bloqueada')).toBeVisible()
  expect(screen.getByText(/Permita o acesso à câmera nas configurações/)).toBeVisible()
  expect(props.onRetry).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Tentar câmera novamente' }))
  expect(props.onRetry).toHaveBeenCalledOnce()
})

it('does not suggest opening a localhost link on another phone', async () => {
  vi.mocked(phoneCaptureUrl).mockReturnValue(null)
  const user = userEvent.setup()
  render(<CameraFallback {...props} status="notFound" />)
  await user.click(screen.getByRole('button', { name: 'Continuar pelo celular' }))
  expect(screen.getByText(/Este endereço não pode ser usado no celular/)).toBeVisible()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Copiar link' })).not.toBeInTheDocument()
})
