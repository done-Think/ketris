import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AgencyAutocomplete } from '../../components/AgencyAutocomplete'
import { registrationService } from '../../services/registration-service'

vi.mock('../../services/registration-service', () => ({
  registrationService: {
    searchAgencies: vi.fn(),
  },
}))

function renderAutocomplete(onChange = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={queryClient}>
      <AgencyAutocomplete value={null} onChange={onChange} />
    </QueryClientProvider>,
  )

  return { onChange }
}

describe('AgencyAutocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não busca nada enquanto o campo está vazio', () => {
    renderAutocomplete()

    expect(registrationService.searchAgencies).not.toHaveBeenCalled()
  })

  it('busca (com debounce) e mostra as opções encontradas', async () => {
    const user = userEvent.setup()
    vi.mocked(registrationService.searchAgencies).mockResolvedValue([
      { id: 'agency-1', name: 'Imobiliária Alameda' },
    ])

    renderAutocomplete()

    await user.type(screen.getByLabelText(/Imobiliária/), 'Alameda')

    await waitFor(() => expect(registrationService.searchAgencies).toHaveBeenCalledWith('Alameda'))
    expect(await screen.findByText('Imobiliária Alameda')).toBeInTheDocument()
  })

  it('chama onChange com a imobiliária escolhida', async () => {
    const user = userEvent.setup()
    vi.mocked(registrationService.searchAgencies).mockResolvedValue([
      { id: 'agency-1', name: 'Imobiliária Alameda' },
    ])
    const { onChange } = renderAutocomplete()

    await user.type(screen.getByLabelText(/Imobiliária/), 'Alameda')
    const option = await screen.findByText('Imobiliária Alameda')
    await user.click(option)

    expect(onChange).toHaveBeenCalledWith({ id: 'agency-1', name: 'Imobiliária Alameda' })
  })

  it('mostra o texto de nenhuma opção encontrada', async () => {
    const user = userEvent.setup()
    vi.mocked(registrationService.searchAgencies).mockResolvedValue([])

    renderAutocomplete()

    await user.type(screen.getByLabelText(/Imobiliária/), 'Inexistente')

    expect(await screen.findByText('Nenhuma imobiliária encontrada')).toBeInTheDocument()
  })
})
