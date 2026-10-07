import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PropertyInquiryDialog } from '../../components/property-detail/PropertyInquiryDialog'

const mutate = vi.fn()

vi.mock('../../hooks/use-submit-property-inquiry', () => ({
  useSubmitPropertyInquiry: () => ({ mutate, isPending: false }),
}))

describe('PropertyInquiryDialog', () => {
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
})
