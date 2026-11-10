import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'

import { PropertyMediaUploadField } from '../../components/PropertyMediaUploadField'
import { createDashboardPropertyDefaultValues } from '../../schemas/create-dashboard-property-schema'
import type { CreateDashboardPropertyFormValues } from '../../types/dashboard-property'
import type { PropertyMediaInput } from '../../types/property'
import { toPropertyPayload } from '../../utils/to-property-payload'
import { toCreatePayload, toUpdatePayload } from '../../utils/property-adapter'

const { upload, notify } = vi.hoisted(() => ({ upload: vi.fn(), notify: vi.fn() }))
vi.mock('../../services/properties-service', () => ({
  propertiesService: { uploadMedia: upload },
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: notify }) }))

function Wrapper({
  initialMedia = [],
  onSubmit = () => {},
}: {
  initialMedia?: PropertyMediaInput[]
  onSubmit?: (values: CreateDashboardPropertyFormValues) => void
}) {
  const { control, handleSubmit } = useForm<CreateDashboardPropertyFormValues>({
    defaultValues: { ...createDashboardPropertyDefaultValues, media: initialMedia },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <PropertyMediaUploadField control={control} />
      <button type="submit">Salvar imóvel</button>
    </form>
  )
}

function renderField() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <Wrapper />
    </QueryClientProvider>,
  )
}

function bigFile(name: string, megabytes: number) {
  const file = new File(['image'], name, { type: 'image/jpeg' })
  Object.defineProperty(file, 'size', { value: megabytes * 1024 * 1024 })
  return file
}

describe('PropertyMediaUploadField', () => {
  beforeEach(() => vi.resetAllMocks())

  it('tells which formats and size are accepted before any upload', () => {
    renderField()
    expect(screen.getByText('JPG, PNG ou WEBP até 8 MB por foto.')).toBeInTheDocument()
  })

  it('explains a rejected format instead of ignoring the file', async () => {
    const { container } = renderField()
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [new File(['%PDF'], 'planta.pdf', { type: 'application/pdf' })] },
    })
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        '"planta.pdf" não foi enviado: use uma foto JPG, PNG ou WEBP.',
        { variant: 'error', autoHideDuration: 6000 },
      ),
    )
    expect(upload).not.toHaveBeenCalled()
  })

  it('goes back to the normal drop area after a rejected file is chosen', async () => {
    const { container } = renderField()
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [new File(['%PDF'], 'planta.pdf', { type: 'application/pdf' })] },
    })
    await waitFor(() => expect(notify).toHaveBeenCalled())
    expect(screen.getByText('Arraste imagens aqui ou clique para selecionar')).toBeInTheDocument()
    expect(screen.queryByText('Este formato não é aceito')).not.toBeInTheDocument()
  })

  it('warns while a file of another format is being dragged over the area', async () => {
    renderField()
    const area = screen.getByText('Arraste imagens aqui ou clique para selecionar')
    const pdf = new File(['%PDF'], 'planta.pdf', { type: 'application/pdf' })
    const dataTransfer = {
      files: [pdf],
      items: [{ kind: 'file', type: 'application/pdf', getAsFile: () => pdf }],
      types: ['Files'],
    }
    await act(async () => {
      fireEvent.dragEnter(area, { dataTransfer })
    })
    expect(await screen.findByText('Este formato não é aceito')).toBeInTheDocument()
    await act(async () => {
      fireEvent.dragLeave(area, { dataTransfer })
    })
    expect(
      await screen.findByText('Arraste imagens aqui ou clique para selecionar'),
    ).toBeInTheDocument()
  })

  it('rejects a photo above 8 MB before sending it, saying its size', async () => {
    const { container } = renderField()
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [bigFile('drone.jpg', 9.4)] },
    })
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        '"drone.jpg" não foi enviado: a foto tem 9,4 MB e o limite é 8 MB.',
        { variant: 'error', autoHideDuration: 6000 },
      ),
    )
    expect(upload).not.toHaveBeenCalled()
  })

  it('uploads the valid photos of a mixed selection and reports only the rejected ones', async () => {
    upload.mockResolvedValue({ url: '/sala.jpg', type: 'photo' })
    const { container } = renderField()
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [
          new File(['image'], 'sala.jpg', { type: 'image/jpeg' }),
          new File(['heic'], 'fachada.heic', { type: 'image/heic' }),
          bigFile('drone.jpg', 9.4),
        ],
      },
    })
    await waitFor(() => expect(container.querySelector('img[src="/sala.jpg"]')).toBeInTheDocument())
    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload.mock.calls[0][0].name).toBe('sala.jpg')
    expect(notify).toHaveBeenCalledTimes(2)
    expect(notify).toHaveBeenCalledWith(
      '"fachada.heic" não foi enviado: use uma foto JPG, PNG ou WEBP.',
      { variant: 'error', autoHideDuration: 6000 },
    )
  })

  it('selects a cover, preserves the other photos and submits its position for creation and editing', async () => {
    const save = vi.fn()
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <Wrapper
          initialMedia={[
            { url: '/kitchen.png', order: 0 },
            { url: '/living-room.png', order: 1 },
            { url: '/bedroom.png', order: 2 },
          ]}
          onSubmit={save}
        />
      </QueryClientProvider>,
    )
    expect(screen.getByRole('button', { name: 'Foto de destaque', pressed: true })).toBeVisible()
    fireEvent.click(screen.getAllByRole('button', { name: 'Definir como destaque' })[1])
    expect(
      Array.from(container.querySelectorAll('img'), (image) => image.getAttribute('src')),
    ).toEqual(['/bedroom.png', '/kitchen.png', '/living-room.png'])
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
    expect(save).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar imóvel' }))
    await waitFor(() => expect(save).toHaveBeenCalledOnce())
    const payload = toPropertyPayload(save.mock.calls[0][0])
    for (const body of [toCreatePayload(payload), toUpdatePayload(payload)]) {
      expect(body.media).toEqual([
        { url: '/bedroom.png', position: 0, type: undefined },
        { url: '/kitchen.png', position: 1, type: undefined },
        { url: '/living-room.png', position: 2, type: undefined },
      ])
    }
  })

  it('uses the next photo as cover after removing the current cover and handles an empty gallery', () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <Wrapper initialMedia={[{ url: '/kitchen.png' }, { url: '/living-room.png' }]} />
      </QueryClientProvider>,
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Remover imagem' })[0])
    expect(container.querySelector('img')).toHaveAttribute('src', '/living-room.png')
    expect(screen.getByRole('button', { name: 'Foto de destaque', pressed: true })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Remover imagem' }))
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Foto de destaque' })).not.toBeInTheDocument()
  })

  it('shows the image service failure with the affected JPG and keeps it out of the form', async () => {
    upload.mockRejectedValue(
      new AxiosError('Unavailable', 'ERR_BAD_RESPONSE', undefined, undefined, {
        status: 503,
        statusText: 'Service Unavailable',
        config: { headers: new AxiosHeaders() },
        headers: {},
        data: { error: { code: 'PROPERTY_MEDIA_STORAGE_UNAVAILABLE' } },
      }),
    )
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <Wrapper />
      </QueryClientProvider>,
    )
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [new File(['image'], 'fachada.jpg', { type: 'image/jpeg' })] },
    })
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        'O serviço de imagens está indisponível. Não foi possível enviar "fachada.jpg". Tente novamente mais tarde.',
        { variant: 'error' },
      ),
    )
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(container.querySelector('input[type="file"]')).not.toBeDisabled()
  })
  it('keeps successful images and identifies each file that failed', async () => {
    upload.mockImplementation((file: File) =>
      file.name === 'failed.png'
        ? Promise.reject(new Error('storage error'))
        : Promise.resolve({
            url: '/api/properties/media/properties/tenant-1/success.png',
            type: 'photo',
          }),
    )
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <Wrapper />
      </QueryClientProvider>,
    )
    const input = container.querySelector('input[type="file"]')
    expect(input).not.toBeNull()
    fireEvent.change(input!, {
      target: {
        files: [
          new File(['image'], 'success.png', { type: 'image/png' }),
          new File(['image'], 'failed.png', { type: 'image/png' }),
        ],
      },
    })
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        'Não foi possível enviar "failed.png". Tente novamente.',
        { variant: 'error' },
      ),
    )
    expect(container.querySelector('img[src$="success.png"]')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Remover imagem' })).toHaveLength(1)
  })

  it('keeps new batches and removals blocked until every upload finishes', async () => {
    let finishUpload!: (result: PropertyMediaInput) => void
    upload.mockImplementation((file: File) =>
      file.name === 'slow.png'
        ? new Promise<PropertyMediaInput>((resolve) => {
            finishUpload = resolve
          })
        : Promise.resolve({ url: '/fast.png', type: 'photo' }),
    )
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <Wrapper initialMedia={[{ url: '/existing.png' }, { url: '/second.png' }]} />
      </QueryClientProvider>,
    )
    const input = container.querySelector('input[type="file"]')!
    fireEvent.change(input, {
      target: {
        files: [
          new File(['image'], 'slow.png', { type: 'image/png' }),
          new File(['image'], 'fast.png', { type: 'image/png' }),
        ],
      },
    })
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(input).toBeDisabled())
    for (const button of screen.getAllByRole('button', { name: 'Remover imagem' }))
      expect(button).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Definir como destaque' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Definir como destaque' }))
    expect(container.querySelector('img')).toHaveAttribute('src', '/existing.png')
    fireEvent.change(input, {
      target: { files: [new File(['image'], 'extra.png', { type: 'image/png' })] },
    })
    expect(upload).toHaveBeenCalledTimes(2)
    await act(async () => finishUpload({ url: '/slow.png', type: 'photo' }))
    await waitFor(() => expect(input).not.toBeDisabled())
    expect(screen.getAllByRole('button', { name: 'Remover imagem' })).toHaveLength(4)
    expect(container.querySelector('img[src="/existing.png"]')).toBeInTheDocument()
    for (const button of screen.getAllByRole('button', { name: 'Remover imagem' }))
      expect(button).not.toBeDisabled()
  })
})
