import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PropertyMediaUploadField } from '../../components/PropertyMediaUploadField'
import { createDashboardPropertyDefaultValues } from '../../schemas/create-dashboard-property-schema'
import type { CreateDashboardPropertyFormValues } from '../../types/dashboard-property'
import type { PropertyMediaInput } from '../../types/property'

const { upload, notify } = vi.hoisted(() => ({ upload: vi.fn(), notify: vi.fn() }))
vi.mock('../../services/properties-service', () => ({
  propertiesService: { uploadMedia: upload },
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: notify }) }))

function Wrapper({ initialMedia = [] }: { initialMedia?: PropertyMediaInput[] }) {
  const { control } = useForm<CreateDashboardPropertyFormValues>({
    defaultValues: { ...createDashboardPropertyDefaultValues, media: initialMedia },
  })
  return <PropertyMediaUploadField control={control} />
}

describe('PropertyMediaUploadField', () => {
  beforeEach(() => vi.resetAllMocks())
  it('keeps successful images and identifies each file that failed', async () => {
    upload.mockImplementation((file: File) =>
      file.name === 'failed.png'
        ? Promise.reject(new Error('storage error'))
        : Promise.resolve({
            url: '/api/properties/media/properties/tenant-1/success.png',
            type: 'foto',
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
        : Promise.resolve({ url: '/fast.png', type: 'foto' }),
    )
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <Wrapper initialMedia={[{ url: '/existing.png' }]} />
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
    expect(screen.getByRole('button', { name: 'Remover imagem' })).toBeDisabled()
    fireEvent.change(input, {
      target: { files: [new File(['image'], 'extra.png', { type: 'image/png' })] },
    })
    expect(upload).toHaveBeenCalledTimes(2)
    await act(async () => finishUpload({ url: '/slow.png', type: 'foto' }))
    await waitFor(() => expect(input).not.toBeDisabled())
    expect(screen.getAllByRole('button', { name: 'Remover imagem' })).toHaveLength(3)
    expect(container.querySelector('img[src="/existing.png"]')).toBeInTheDocument()
    for (const button of screen.getAllByRole('button', { name: 'Remover imagem' }))
      expect(button).not.toBeDisabled()
  })
})
