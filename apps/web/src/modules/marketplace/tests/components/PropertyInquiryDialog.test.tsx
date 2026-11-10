import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PropertyInquiryDialog } from '../../components/property-detail/PropertyInquiryDialog'

const mutate = vi.fn()
const enqueueSnackbar = vi.fn()

vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))

vi.mock('../../hooks/use-submit-property-inquiry', () => ({
  useSubmitPropertyInquiry: () => ({ mutate, isPending: false }),
}))

describe('PropertyInquiryDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the visit copy and title in visit mode', () => {
    render(<PropertyInquiryDialog open mode="visit" propertyId="property-1" onClose={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Agendar visita' })).toBeVisible()
    expect(screen.queryByLabelText('Valor proposto')).not.toBeInTheDocument()
  })

  it('shows the proposed value field in proposal mode', () => {
    render(<PropertyInquiryDialog open mode="proposal" propertyId="property-1" onClose={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Enviar proposta' })).toBeVisible()
    expect(screen.getByLabelText('Valor proposto')).toBeInTheDocument()
  })

  it('validates required fields before submitting', async () => {
    const user = userEvent.setup()
    render(<PropertyInquiryDialog open mode="visit" propertyId="property-1" onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByText('Informe seu nome')).toBeVisible()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('submits the inquiry with the filled-in data', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<PropertyInquiryDialog open mode="visit" propertyId="property-1" onClose={onClose} />)

    await user.type(screen.getByLabelText('Nome'), 'Maria Silva')
    await user.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ leadName: 'Maria Silva', leadEmail: 'maria@exemplo.com' }),
      expect.anything(),
    )
  })

  async function fillContact(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText('Nome'), 'Maria Silva')
    await user.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com')
  }

  it('sends no proposed value when the field is empty or only zeros were typed', async () => {
    const user = userEvent.setup()
    render(<PropertyInquiryDialog open mode="proposal" propertyId="property-1" onClose={vi.fn()} />)
    await fillContact(user)

    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(mutate).toHaveBeenLastCalledWith(
      expect.objectContaining({ proposedValue: undefined }),
      expect.anything(),
    )

    mutate.mockClear()
    await user.type(screen.getByLabelText('Valor proposto'), '00')
    expect(screen.getByLabelText('Valor proposto')).toHaveValue('')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(mutate).toHaveBeenLastCalledWith(
      expect.objectContaining({ proposedValue: undefined }),
      expect.anything(),
    )
  })

  it('formats the proposed value in reais, filling the cents from the right', async () => {
    const user = userEvent.setup()
    render(<PropertyInquiryDialog open mode="proposal" propertyId="property-1" onClose={vi.fn()} />)
    await fillContact(user)

    expect(screen.getByText('R$')).toBeVisible()
    await user.type(screen.getByLabelText('Valor proposto'), '080000000')
    expect(screen.getByLabelText('Valor proposto')).toHaveValue('800.000,00')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ proposedValue: 800000 }),
      expect.anything(),
    )
  })

  it('masks the phone with area code and stops at 11 digits', async () => {
    const user = userEvent.setup()
    render(<PropertyInquiryDialog open mode="visit" propertyId="property-1" onClose={vi.fn()} />)
    await fillContact(user)

    await user.type(screen.getByLabelText('Telefone'), '11111111111111111111111')
    expect(screen.getByLabelText('Telefone')).toHaveValue('(11) 11111-1111')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ leadPhone: '(11) 11111-1111' }),
      expect.anything(),
    )
  })

  it('rejects an incomplete phone but keeps the phone optional', async () => {
    const user = userEvent.setup()
    render(<PropertyInquiryDialog open mode="visit" propertyId="property-1" onClose={vi.fn()} />)
    await fillContact(user)

    await user.type(screen.getByLabelText('Telefone'), '3598')
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(
      await screen.findByText('Informe um telefone com DDD, como (11) 99999-9999'),
    ).toBeVisible()
    expect(mutate).not.toHaveBeenCalled()

    await user.clear(screen.getByLabelText('Telefone'))
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ leadPhone: undefined }),
      expect.anything(),
    )
  })

  it('explains the wait when the proposal limit is reached', async () => {
    const user = userEvent.setup()
    mutate.mockImplementation((_payload, options: { onError: (error: unknown) => void }) =>
      options.onError(
        new AxiosError('Too Many Requests', '429', undefined, undefined, {
          status: 429,
          statusText: 'Too Many Requests',
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: { error: { code: 'RATE_LIMIT_EXCEEDED' } },
        }),
      ),
    )
    render(<PropertyInquiryDialog open mode="visit" propertyId="property-1" onClose={vi.fn()} />)
    await fillContact(user)
    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(enqueueSnackbar).toHaveBeenCalledWith(
      'Você enviou muitas mensagens em pouco tempo. Aguarde alguns minutos e tente novamente.',
      { variant: 'error' },
    )
  })
})
