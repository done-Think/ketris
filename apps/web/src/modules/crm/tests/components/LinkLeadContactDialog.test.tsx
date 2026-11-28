import { ThemeProvider } from '@mui/material'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@shared/theme/theme'
import { LinkLeadContactDialog } from '../../components/interactions/LinkLeadContactDialog'
import type { DashboardLead } from '../../types/lead'

const mocks = vi.hoisted(() => ({ save: vi.fn(), reset: vi.fn() }))
vi.mock('../../hooks/use-contact-link', () => ({
  useContactLink: () => ({
    mutateAsync: mocks.save,
    reset: mocks.reset,
    isPending: false,
    isError: false,
  }),
}))
vi.mock('../../components/ContactPicker', () => ({
  ContactPicker: ({
    onChange,
    helperText,
  }: {
    onChange: (value: { id: string; name: string }) => void
    helperText?: string
  }) => (
    <>
      <button type="button" onClick={() => onChange({ id: 'existing-contact', name: 'Customer' })}>
        Select existing customer
      </button>
      <span>{helperText}</span>
    </>
  ),
}))
const lead: DashboardLead = {
  id: 'lead',
  name: 'Customer',
  email: 'customer@example.invalid',
  phone: '11999990000',
  budget: '',
  lastContact: '',
  lastContactAt: '',
  interest: 'House',
  source: 'OTHER',
  broker: '',
  stage: 'NEW',
  opportunityId: null,
}
function show(onClose = vi.fn()) {
  render(
    <ThemeProvider theme={theme}>
      <LinkLeadContactDialog lead={lead} onClose={onClose} />
    </ThemeProvider>,
  )
  return onClose
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.save.mockResolvedValue({ ...lead, contactId: 'existing-contact' })
})
describe('Explicit contact linking dialog', () => {
  it('requires a contact selection and links its ID instead of guessing by email', async () => {
    const user = userEvent.setup()
    const close = show()
    await user.click(screen.getByRole('button', { name: 'Vincular contato' }))
    expect(mocks.save).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Select existing customer' }))
    await user.click(screen.getByRole('button', { name: 'Vincular contato' }))
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith({ contactId: 'existing-contact' }))
    expect(close).toHaveBeenCalledOnce()
  })
  it('opens an explicit prefilled contact form before creating a new contact', async () => {
    const user = userEvent.setup()
    show()
    await user.click(screen.getByRole('button', { name: 'Criar contato' }))
    expect(screen.getByLabelText(/^Nome/)).toHaveValue(lead.name)
    expect(screen.getByLabelText(/^E-mail/)).toHaveValue(lead.email)
    expect(mocks.save).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith({
        contact: expect.objectContaining({ name: lead.name, email: lead.email, type: 'RENTER' }),
      }),
    )
  })
  it('does not create or link anything when cancelled', async () => {
    const user = userEvent.setup()
    const close = show()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(close).toHaveBeenCalledOnce()
    expect(mocks.save).not.toHaveBeenCalled()
  })
})
