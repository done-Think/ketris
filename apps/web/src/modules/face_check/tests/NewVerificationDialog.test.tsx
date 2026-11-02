import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NewVerificationDialog } from '../components/console/new-verification/NewVerificationDialog'

const create = vi.hoisted(() => vi.fn())
vi.mock('../hooks/use-console-mutations', () => ({
  useCreateSession: () => ({ mutate: create, data: undefined, isPending: false, error: null }),
}))
vi.mock('../hooks/use-console-queries', () => ({
  useFaceCheckProperties: () => ({
    data: [{ id: 'property-1', title: 'Test property', address: null }],
    isPending: false,
    error: null,
  }),
}))

beforeEach(() => create.mockReset())

describe('manual verification recipient', () => {
  it('shows an explicitly labeled email field and submits that address as the candidate contact', async () => {
    render(<NewVerificationDialog open onClose={vi.fn()} />)
    const user = userEvent.setup()
    const email = screen.getByRole('textbox', { name: /e-mail/i })
    expect(email).toBeVisible()
    await user.click(screen.getByRole('combobox', { name: /Imóvel/ }))
    await user.click(screen.getByRole('option', { name: 'Test property' }))
    await user.type(screen.getByRole('textbox', { name: /Nome da pessoa/ }), 'Test Candidate')
    await user.type(email, 'candidate@ketris.test')
    await user.click(screen.getByRole('button', { name: 'Enviar convite' }))
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyId: 'property-1',
          personName: 'Test Candidate',
          contact: 'candidate@ketris.test',
        }),
      ),
    )
  })

  it.each(['', '35999999999', 'not-an-email'])(
    'does not create a verification without a valid email: %s',
    async (contact) => {
      render(<NewVerificationDialog open onClose={vi.fn()} />)
      const user = userEvent.setup()
      await user.click(screen.getByRole('combobox', { name: /Imóvel/ }))
      await user.click(screen.getByRole('option', { name: 'Test property' }))
      await user.type(screen.getByRole('textbox', { name: /Nome da pessoa/ }), 'Test Candidate')
      const email = screen.getByRole('textbox', { name: /e-mail/i })
      expect(email).toBeRequired()
      expect(email).toHaveAttribute('type', 'email')
      if (contact) await user.type(email, contact)
      await user.click(screen.getByRole('button', { name: 'Enviar convite' }))
      expect(
        await screen.findByText(
          contact ? 'Informe um e-mail válido.' : 'Informe o e-mail da pessoa.',
        ),
      ).toBeVisible()
      expect(create).not.toHaveBeenCalled()
    },
  )
})
