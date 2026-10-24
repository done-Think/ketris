import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'
import {
  act,
  fireEvent,
  render as renderWithTestingLibrary,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CreatePropertyDashboardPage } from '../../components/CreatePropertyDashboardPage'
import { EditPropertyDashboardPage } from '../../components/EditPropertyDashboardPage'
import { editableProperty } from '../fixtures/editable-property'
import type { Property, PropertyMediaInput } from '../../types/property'

const state = vi.hoisted(() => ({
  query: {
    data: undefined as Property | undefined,
    isError: false,
    isLoading: false,
    error: null as unknown,
    refetch: vi.fn(),
  },
  upload: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  push: vi.fn(),
  notify: vi.fn(),
}))
vi.mock('../../services/properties-service', () => ({
  propertiesService: { uploadMedia: state.upload },
}))
vi.mock('../../hooks/use-properties', async () => {
  const actual = await vi.importActual<typeof import('../../hooks/use-properties')>(
    '../../hooks/use-properties',
  )
  return {
    useProperty: () => state.query,
    useCreateProperty: () => ({ mutateAsync: state.create, isPending: false }),
    useUpdateProperty: () => ({ mutateAsync: state.update, isPending: false }),
    usePropertyOwners: () => ({ data: [], isError: false, isLoading: false }),
    useUploadPropertyMediaBatch: actual.useUploadPropertyMediaBatch,
    usePropertyMediaUploadsPending: actual.usePropertyMediaUploadsPending,
  }
})
function render(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { mutations: { gcTime: Infinity } } })
  return renderWithTestingLibrary(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
}
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push: state.push }) }))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { role: 'OWNER' } }) }))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: state.notify }) }))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  state.upload.mockReset()
  state.query = { data: undefined, isError: false, isLoading: false, error: null, refetch: vi.fn() }
  state.create.mockResolvedValue({ id: 'new-property' })
  state.update.mockResolvedValue(editableProperty)
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

afterEach(() => vi.unstubAllGlobals())

describe('property forms', () => {
  it('validates the current step before allowing the user to advance', async () => {
    const user = userEvent.setup()
    render(<CreatePropertyDashboardPage />)
    expect(screen.getByLabelText('Título do anúncio')).toHaveValue('')
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(await screen.findByText('Informe o título do anúncio')).toBeVisible()
    expect(state.create).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('CEP')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Título do anúncio'), 'Casa com jardim')
    await user.type(screen.getByLabelText('Descrição'), 'Casa ampla com jardim e garagem')
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(await screen.findByLabelText('Endereço', { selector: 'input' })).toHaveValue('')
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(await screen.findByText('Informe o endereço')).toBeVisible()
    expect(screen.queryByLabelText('Área útil')).not.toBeInTheDocument()
  })

  it('saves a new property as a draft and does not promise publication', async () => {
    const user = userEvent.setup()
    render(<CreatePropertyDashboardPage />)
    await user.type(screen.getByLabelText('Título do anúncio'), 'Casa com jardim')
    await user.type(screen.getByLabelText('Descrição'), 'Casa ampla com jardim e garagem')
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await screen.findByLabelText('Endereço', { selector: 'input' })
    for (const [label, value] of [
      ['Endereço', 'Rua das Flores'],
      ['Número', '10'],
      ['Bairro', 'Centro'],
      ['Cidade', 'Curitiba'],
      ['Estado', 'PR'],
      ['CEP', '80000000'],
    ]) {
      await user.type(screen.getByLabelText(label, { selector: 'input' }), value)
    }
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    fireEvent.change(await screen.findByLabelText('Área útil'), { target: { value: '80' } })
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await waitFor(() => expect(screen.queryByLabelText('Área útil')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await user.type(await screen.findByLabelText('Valor do aluguel'), '2500,50')
    await user.type(screen.getByLabelText('Garantia'), 'Caução de dois aluguéis')
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    const save = await screen.findByRole('button', { name: 'Salvar rascunho' })
    expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument()
    await user.click(save)
    await waitFor(() => expect(state.create).toHaveBeenCalledOnce())
    expect(state.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Casa com jardim', price: 2500.5, purpose: 'RENT' }),
    )
    expect(state.push).toHaveBeenCalledWith({
      pathname: '/dashboard/properties/[id]',
      params: { id: 'new-property' },
    })
  })

  it('blocks advancing and submitting until all selected media uploads finish', async () => {
    const user = userEvent.setup()
    let finishUpload!: (value: PropertyMediaInput) => void
    state.upload.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishUpload = resolve
        }),
    )
    const { container } = render(<CreatePropertyDashboardPage />)
    await user.type(screen.getByLabelText('Título do anúncio'), 'Casa com jardim')
    await user.type(screen.getByLabelText('Descrição'), 'Casa ampla com jardim e garagem')
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await screen.findByLabelText('Endereço', { selector: 'input' })
    for (const [label, value] of [
      ['Endereço', 'Rua das Flores'],
      ['Número', '10'],
      ['Bairro', 'Centro'],
      ['Cidade', 'Curitiba'],
      ['Estado', 'PR'],
      ['CEP', '80000000'],
    ]) {
      await user.type(screen.getByLabelText(label, { selector: 'input' }), value)
    }
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    fireEvent.change(await screen.findByLabelText('Área útil'), { target: { value: '80' } })
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await waitFor(() => expect(screen.queryByLabelText('Área útil')).not.toBeInTheDocument())
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    await user.upload(input, new File(['image'], 'slow.png', { type: 'image/png' }))
    await waitFor(() => expect(state.upload).toHaveBeenCalledOnce())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Próximo' })).toBeDisabled())
    fireEvent.submit(container.querySelector('form')!)
    expect(screen.queryByLabelText('Valor do aluguel')).not.toBeInTheDocument()
    expect(state.create).not.toHaveBeenCalled()
    await act(async () =>
      finishUpload({ url: '/api/properties/media/properties/tenant-1/slow.png', type: 'foto' }),
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Próximo' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await user.type(await screen.findByLabelText('Valor do aluguel'), '2500,50')
    await user.type(screen.getByLabelText('Garantia'), 'Caução de dois aluguéis')
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    const save = await screen.findByRole('button', { name: 'Salvar rascunho' })
    expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument()
    await user.click(save)
    await waitFor(() => expect(state.create).toHaveBeenCalledOnce())
    expect(state.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Casa com jardim',
        price: 2500.5,
        purpose: 'RENT',
        media: [
          { url: '/api/properties/media/properties/tenant-1/slow.png', type: 'foto', order: 0 },
        ],
      }),
    )
    expect(state.push).toHaveBeenCalledWith({
      pathname: '/dashboard/properties/[id]',
      params: { id: 'new-property' },
    })
  })

  it('preserves local edits and untouched initial values when a background refetch arrives', async () => {
    const user = userEvent.setup()
    state.query.data = editableProperty
    const { rerender } = render(<EditPropertyDashboardPage propertyId={editableProperty.id} />)
    const title = screen.getByLabelText('Título do anúncio')
    await user.clear(title)
    await user.type(title, 'Minha edição local')
    state.query.data = {
      ...editableProperty,
      title: 'Título recebido no refetch',
      description: 'Descrição externa do imóvel',
    }
    rerender(<EditPropertyDashboardPage propertyId={editableProperty.id} />)
    expect(screen.getByLabelText('Título do anúncio')).toHaveValue('Minha edição local')
    expect(screen.getByLabelText('Descrição')).toHaveValue(editableProperty.description)

    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await screen.findByLabelText('Endereço', { selector: 'input' })
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await screen.findByLabelText('Área útil')
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await waitFor(() => expect(screen.queryByLabelText('Área útil')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await screen.findByLabelText('Valor de referência do imóvel')
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await user.click(await screen.findByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => expect(state.update).toHaveBeenCalledOnce())
    expect(state.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Minha edição local',
        description: editableProperty.description,
        listing: editableProperty.listing,
        address: editableProperty.address,
      }),
    )
  })
  it('blocks editing submission and forward navigation while an upload continues after leaving the media step', async () => {
    const user = userEvent.setup()
    state.query.data = editableProperty
    let finishUpload!: (value: PropertyMediaInput) => void
    state.upload.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishUpload = resolve
        }),
    )
    const { container } = render(<EditPropertyDashboardPage propertyId={editableProperty.id} />)
    await user.click(screen.getAllByRole('button', { name: /Mídia/ })[0])
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    await user.upload(input, new File(['image'], 'slow.png', { type: 'image/png' }))
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Publicação/ })[0]).toBeDisabled(),
    )
    await user.click(screen.getAllByRole('button', { name: /Dados básicos/i })[0])
    fireEvent.submit(container.querySelector('form')!)
    expect(state.update).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Próximo' })).toBeDisabled()
    await act(async () =>
      finishUpload({ url: '/api/properties/media/properties/tenant-1/slow.png', type: 'foto' }),
    )
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Publicação/ })[0]).toBeEnabled(),
    )
    await user.click(screen.getAllByRole('button', { name: /Publicação/ })[0])
    await user.click(await screen.findByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => expect(state.update).toHaveBeenCalledOnce())
    expect(state.update.mock.calls[0][0].media).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: '/api/properties/media/properties/tenant-1/slow.png' }),
      ]),
    )
  })

  it('rejects fractional room counts before leaving the features step', async () => {
    const user = userEvent.setup()
    state.query.data = editableProperty
    render(<EditPropertyDashboardPage propertyId={editableProperty.id} />)
    await user.click(screen.getAllByRole('button', { name: /Características/ })[0])
    fireEvent.change(await screen.findByLabelText('Quartos'), { target: { value: '1.5' } })
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(await screen.findByText('Informe um número inteiro')).toBeVisible()
    expect(screen.getByLabelText('Quartos')).toBeVisible()
    expect(state.update).not.toHaveBeenCalled()
  })
})
