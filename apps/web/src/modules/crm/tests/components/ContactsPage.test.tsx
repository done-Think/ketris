vi.mock('../../hooks/use-leads', () => ({
  useCreateLead: () => ({ mutate: vi.fn(), isPending: false }),
}))
import { ThemeProvider } from '@mui/material'
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { ContactsPage } from '../../components/ContactsPage'
import type { ApiContactListItem } from '../../types/contact'
import { contactListFixtures } from '../fixtures/contact-list-fixtures'

const mocks = vi.hoisted(() => ({
  startContactMutateAsync: vi.fn(),
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

vi.mock('@shared/hooks/use-dashboard-face-check-notifications', () => ({
  useDashboardFaceCheckNotifications: () => [],
}))
vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
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

vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))

const contact: ApiContactListItem = {
  id: 'contact-1',
  tenantId: 'tenant-1',
  name: 'Ricardo Mendes',
  email: 'ricardo@example.com',
  phone: '(11) 98722-1200',
  type: 'RENTER',
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
    mocks.useContacts.mockReturnValue({
      data: {
        contacts: [contact],
        pagination: { page: 1, pageSize: 5, pageCount: 1, totalCount: 1 },
        groups: [],
      },
      isLoading: false,
      isError: false,
    })
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

  it('shows the empty state when the tenant has no contacts', () => {
    mocks.useContacts.mockReturnValue({
      data: {
        contacts: [],
        pagination: { page: 1, pageSize: 5, pageCount: 1, totalCount: 0 },
        groups: [],
      },
      isLoading: false,
      isError: false,
    })
    renderContactsPage()
    expect(screen.queryAllByText(contactListFixtures[0].name)).toHaveLength(0)
    expect(screen.getByText('0-0 de 0')).toBeVisible()
  })

  it('opens a prefilled lead form from the existing contact action', async () => {
    const user = userEvent.setup()
    renderContactsPage()
    const table = screen.getByRole('table', { name: 'Contatos do CRM' })
    await user.click(within(table).getByRole('button', { name: 'Mais opções para Ricardo Mendes' }))
    await user.click(screen.getByRole('menuitem', { name: 'Adicionar Ricardo Mendes a Leads' }))
    expect(screen.getByLabelText('Nome')).toHaveValue(contact.name)
    expect(screen.getByLabelText(/E-mail/)).toHaveValue(contact.email)
  })

  it('records a direct contact attempt and opens its history from the email menu item', async () => {
    const user = userEvent.setup()
    renderContactsPage()
    const table = screen.getByRole('table', { name: 'Contatos do CRM' })
    expect(within(table).queryByRole('link', { name: contact.email })).not.toBeInTheDocument()
    await user.click(within(table).getByRole('button', { name: 'Mais opções para Ricardo Mendes' }))
    const email = screen.getByRole('menuitem', { name: 'E-mail' })
    email.addEventListener('click', (event) => event.preventDefault())
    fireEvent.click(email)
    await waitFor(() =>
      expect(mocks.startContactMutateAsync).toHaveBeenCalledWith({
        contactId: contact.id,
        payload: { channel: 'EMAIL', requestId: expect.any(String) },
      }),
    )
    expect(screen.getByRole('dialog')).toBeVisible()
  })

  it('opens and closes the interaction history for the selected contact', async () => {
    const user = userEvent.setup()
    renderContactsPage()
    await user.click(
      within(screen.getByRole('table', { name: 'Contatos do CRM' })).getByRole('button', {
        name: 'Ver intera\u00e7\u00f5es de Ricardo Mendes',
      }),
    )
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Intera\u00e7\u00f5es')).toBeVisible()
    expect(within(dialog).getByText('Nenhuma intera\u00e7\u00e3o registrada.')).toBeVisible()
    await user.click(within(dialog).getByRole('button', { name: 'Fechar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
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
    await user.click(screen.getByRole('menuitem', { name: 'Arquivar Ricardo Mendes' }))
    expect(screen.getByRole('heading', { name: 'Arquivar contato?' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Arquivar' }))

    expect(mocks.archiveContactMutateAsync).toHaveBeenCalledWith(contact.id)
  })
})

vi.mock('../../hooks/use-interactions', () => ({
  useInteractions: () => ({
    data: { interactions: [], pagination: { page: 1, pageSize: 5, pageCount: 1, totalCount: 0 } },
    isLoading: false,
    isError: false,
  }),
  useStartContactInteraction: () => ({
    mutateAsync: mocks.startContactMutateAsync,
    isPending: false,
    isSuccess: false,
  }),
  useStartInteraction: () => ({ mutateAsync: vi.fn(), isPending: false, isSuccess: false }),
  useCompleteInteraction: () => ({ mutateAsync: vi.fn(), isPending: false, isError: false }),
}))
