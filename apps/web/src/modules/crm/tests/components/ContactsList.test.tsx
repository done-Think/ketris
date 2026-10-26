import { ThemeProvider } from '@mui/material'
import { theme } from '@shared/theme/theme'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ContactsList } from '../../components/ContactsList'
import type { ContactsListProps } from '../../types/contact'
import { getContactListFixtures } from '../fixtures/contact-list-fixtures'

vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { tenantId: 'tenant-1' } }) }))
vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))

function renderList(props: ContactsListProps = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <ContactsList
        contacts={getContactListFixtures('pt-BR').slice(0, 5)}
        totalCount={6}
        counts={{ ALL: 6, PROPRIETARIO: 2, LOCATARIO: 3, CORRETOR: 1 }}
        {...props}
      />
    </ThemeProvider>,
  )
}

describe('ContactsList', () => {
  it('renders the server page and global counts', () => {
    renderList()
    const table = screen.getByRole('table', { name: 'Contatos do CRM' })
    expect(within(table).getAllByRole('row')).toHaveLength(6)
    expect(screen.getByText('1-5 de 6')).toBeVisible()
    expect(within(table).getByText('Ricardo Mendes')).toBeVisible()
    expect(screen.getByRole('button', { name: /Proprietários/ })).toHaveTextContent('2')
  })

  it('delegates search, filter and pagination to the server list owner', () => {
    const onSearchChange = vi.fn(),
      onFilterChange = vi.fn(),
      onPageChange = vi.fn()
    renderList({ onSearchChange, onFilterChange, onPageChange })
    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar contatos' }), {
      target: { value: 'Letícia' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Proprietários/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }))
    expect(onSearchChange).toHaveBeenCalledWith('Letícia')
    expect(onFilterChange).toHaveBeenCalledWith('PROPRIETARIO')
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('uses the controlled page directly when refreshed', () => {
    const { rerender } = renderList()
    rerender(
      <ThemeProvider theme={theme}>
        <ContactsList contacts={[getContactListFixtures('pt-BR')[5]]} totalCount={6} page={2} />
      </ThemeProvider>,
    )
    expect(screen.getByText('6-6 de 6')).toBeVisible()
    expect(screen.queryByText('Ricardo Mendes')).not.toBeInTheDocument()
  })

  it('keeps the empty state empty without fixtures', () => {
    renderList({ contacts: [], totalCount: 0 })
    expect(screen.queryByText('Ricardo Mendes')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('delegates creation, editing, interaction and archive actions', () => {
    const onNewContact = vi.fn(),
      onEditContact = vi.fn(),
      onOpenInteractions = vi.fn(),
      onOpenMoreOptions = vi.fn()
    renderList({ onNewContact, onEditContact, onOpenInteractions, onOpenMoreOptions })
    const table = screen.getByRole('table', { name: 'Contatos do CRM' })
    fireEvent.click(screen.getByRole('button', { name: 'Novo Contato' }))
    fireEvent.click(within(table).getByRole('button', { name: 'Editar Ricardo Mendes' }))
    fireEvent.click(within(table).getByRole('button', { name: 'Ver interações de Ricardo Mendes' }))
    fireEvent.click(within(table).getByRole('button', { name: 'Mais opções para Ricardo Mendes' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Arquivar Ricardo Mendes' }))
    expect(onNewContact).toHaveBeenCalledOnce()
    for (const action of [onEditContact, onOpenInteractions, onOpenMoreOptions])
      expect(action).toHaveBeenCalledWith(expect.objectContaining({ id: 'ricardo-mendes' }))
  })
})
