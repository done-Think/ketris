import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { ContactsPage } from '../../components/ContactsPage'
import type { ApiContactListItem } from '../../types/contact'

const mocks = vi.hoisted(() => ({
  useContacts: vi.fn(),
  useCreateContact: vi.fn(),
  useUpdateContact: vi.fn(),
  useArchiveContact: vi.fn(),
  createContactMutateAsync: vi.fn(),
  updateContactMutateAsync: vi.fn(),
  archiveContactMutateAsync: vi.fn(),
  enqueueSnackbar: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { tenantId: 'tenant-1' },
    status: 'authenticated',
  }),
}))

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }),
}))

vi.mock('../../hooks/use-contacts', () => ({
  useContacts: mocks.useContacts,
  useCreateContact: mocks.useCreateContact,
  useUpdateContact: mocks.useUpdateContact,
  useArchiveContact: mocks.useArchiveContact,
}))

const contact: ApiContactListItem = {
  id: 'contact-1',
  tenantId: 'tenant-1',
  name: 'Ricardo Mendes',
  email: 'ricardo@example.com',
  phone: '(11) 98722-1200',
  type: 'LOCATARIO',
  avatarUrl: null,
  notes: 'Interessado em apartamentos',
  lastInteraction: null,
  archivedAt: null,
  createdAt: '2026-08-10T10:00:00.000Z',
  updatedAt: '2026-08-10T10:00:00.000Z',
  propertyCount: 2,
}

function renderContactsPage() {
  return render(
    <ThemeProvider theme={theme}>
      <ContactsPage />
    </ThemeProvider>,
  )
}

describe('ContactsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useContacts.mockReturnValue({ data: [contact], isLoading: false, isError: false })
    mocks.useCreateContact.mockReturnValue({
      mutateAsync: mocks.createContactMutateAsync,
      isPending: false,
    })
    mocks.useUpdateContact.mockReturnValue({
      mutateAsync: mocks.updateContactMutateAsync,
      isPending: false,
    })
    mocks.useArchiveContact.mockReturnValue({
      mutateAsync: mocks.archiveContactMutateAsync,
      isPending: false,
    })
  })

  it('maps real API contacts to the list view-model', () => {
    renderContactsPage()

    const table = screen.getByRole('table', { name: 'Contatos do CRM' })
    const row = within(table).getByText('Ricardo Mendes').closest('tr')

    expect(row).not.toBeNull()
    expect(within(row!).getByText('Locatário')).toBeInTheDocument()
    expect(within(row!).getByText('(11) 98722-1200')).toBeInTheDocument()
  })

  it('opens the create dialog and saves a new contact', async () => {
    const user = userEvent.setup()
    mocks.createContactMutateAsync.mockResolvedValueOnce(contact)
    renderContactsPage()

    await user.click(screen.getByRole('button', { name: 'Novo Contato' }))
    expect(screen.getByRole('heading', { name: 'Novo contato' })).toBeVisible()

    await user.type(screen.getByLabelText(/^Nome/), 'Joao Souza')
    await user.type(screen.getByLabelText(/^E-mail/), 'joao@example.com')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(mocks.createContactMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Joao Souza', email: 'joao@example.com' }),
    )
  })

  it('opens the edit dialog pre-filled and saves the changes', async () => {
    const user = userEvent.setup()
    mocks.updateContactMutateAsync.mockResolvedValueOnce(contact)
    renderContactsPage()

    const table = screen.getByRole('table', { name: 'Contatos do CRM' })
    await user.click(within(table).getByRole('button', { name: 'Editar Ricardo Mendes' }))
    expect(screen.getByLabelText(/^Nome/)).toHaveValue('Ricardo Mendes')

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(mocks.updateContactMutateAsync).toHaveBeenCalledWith({
      id: contact.id,
      changes: expect.objectContaining({ name: 'Ricardo Mendes' }),
    })
  })

  it('archives a contact after confirming', async () => {
    const user = userEvent.setup()
    mocks.archiveContactMutateAsync.mockResolvedValueOnce({
      ...contact,
      archivedAt: '2026-09-01T00:00:00.000Z',
    })
    renderContactsPage()

    const table = screen.getByRole('table', { name: 'Contatos do CRM' })
    await user.click(within(table).getByRole('button', { name: 'Mais opções para Ricardo Mendes' }))
    expect(screen.getByRole('heading', { name: 'Arquivar contato?' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Arquivar' }))

    expect(mocks.archiveContactMutateAsync).toHaveBeenCalledWith(contact.id)
  })
})
