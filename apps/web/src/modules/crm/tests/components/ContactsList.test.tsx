import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { ContactsList } from '../../components/ContactsList'
import type { ContactsListProps } from '../../types/contact'

function renderContactsList(props: ContactsListProps = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <ContactsList {...props} />
    </ThemeProvider>,
  )
}

describe('ContactsList', () => {
  it('renders the official six-contact fixture and table structure', () => {
    renderContactsList()

    const table = screen.getByRole('table', { name: 'Contatos do CRM' })

    expect(within(table).getAllByRole('row')).toHaveLength(7)
    expect(screen.getByRole('heading', { name: 'Contatos' })).toBeVisible()
    expect(screen.getByPlaceholderText('Buscar contato por nome, email, fone...')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Novo Contato' })).toBeVisible()
    expect(screen.getByText('Mostrando 1–6 de 234')).toBeVisible()

    ;['Nome', 'Tipo', 'Telefone', 'Email', 'Imóveis', 'Última interação', 'Ações'].forEach(
      (heading) => expect(within(table).getByText(heading)).toBeInTheDocument(),
    )

    const ricardoRow = within(table).getByText('Ricardo Mendes').closest('tr')
    expect(ricardoRow).not.toBeNull()
    expect(within(ricardoRow!).getByText('Locatário')).toBeInTheDocument()
    expect(within(ricardoRow!).getByText('(11) 98722-1200')).toBeInTheDocument()
    expect(within(ricardoRow!).getByText('ricardo.mendes@email.com')).toBeInTheDocument()
    expect(within(ricardoRow!).getByText('2')).toBeInTheDocument()
    expect(within(ricardoRow!).getByText('Há 2 horas')).toBeInTheDocument()

    const heitorRow = within(table).getByText('Heitor Prado').closest('tr')
    expect(heitorRow).not.toBeNull()
    expect(within(heitorRow!).getByText('heitor.prado@ketrisrealty.com')).toBeInTheDocument()
  })

  it('shows the requested contact-type distribution', () => {
    renderContactsList()

    const table = screen.getByRole('table', { name: 'Contatos do CRM' })

    expect(within(table).getAllByText('Locatário')).toHaveLength(3)
    expect(within(table).getAllByText('Proprietário')).toHaveLength(2)
    expect(within(table).getAllByText('Corretor')).toHaveLength(1)
  })

  it('filters contacts by normalized name, email, and phone', () => {
    renderContactsList()

    const search = screen.getByRole('textbox', { name: 'Buscar contatos' })
    const table = screen.getByRole('table', { name: 'Contatos do CRM' })

    fireEvent.change(search, { target: { value: 'leticia' } })
    expect(within(table).getByText('Letícia Ramos')).toBeInTheDocument()
    expect(within(table).queryByText('Ricardo Mendes')).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'grupojardins' } })
    expect(within(table).getByText('Ana Beatriz Ramos')).toBeInTheDocument()

    fireEvent.change(search, { target: { value: '98112' } })
    expect(within(table).getByText('Heitor Prado')).toBeInTheDocument()
  })

  it('filters by the four reference pills and exposes the active state', () => {
    renderContactsList()

    const allFilter = screen.getByRole('button', { name: 'Todos' })
    const ownersFilter = screen.getByRole('button', { name: 'Proprietários' })
    const table = screen.getByRole('table', { name: 'Contatos do CRM' })

    expect(allFilter).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(ownersFilter)

    expect(ownersFilter).toHaveAttribute('aria-pressed', 'true')
    expect(allFilter).toHaveAttribute('aria-pressed', 'false')
    expect(within(table).getByText('Sandra Vasconcellos')).toBeInTheDocument()
    expect(within(table).getByText('Ana Beatriz Ramos')).toBeInTheDocument()
    expect(within(table).queryByText('Ricardo Mendes')).not.toBeInTheDocument()
    expect(screen.getByText('Mostrando 1–2 de 2')).toBeVisible()
  })

  it('selects individual contacts and all visible contacts', () => {
    renderContactsList()

    const table = screen.getByRole('table', { name: 'Contatos do CRM' })
    const selectAll = within(table).getByRole('checkbox', {
      name: 'Selecionar todos os contatos visíveis',
    })
    const ricardo = within(table).getByRole('checkbox', { name: 'Selecionar Ricardo Mendes' })

    fireEvent.click(ricardo)

    expect(ricardo).toBeChecked()
    expect(selectAll).toHaveAttribute('data-indeterminate', 'true')

    fireEvent.click(selectAll)

    ;[
      'Ricardo Mendes',
      'Sandra Vasconcellos',
      'Heitor Prado',
      'Letícia Ramos',
      'Carlos Eduardo',
      'Ana Beatriz Ramos',
    ].forEach((name) => {
      expect(within(table).getByRole('checkbox', { name: `Selecionar ${name}` })).toBeChecked()
    })

    fireEvent.click(selectAll)
    expect(ricardo).not.toBeChecked()
  })

  it('renders exactly the three requested actions for each contact', () => {
    renderContactsList()

    const table = screen.getByRole('table', { name: 'Contatos do CRM' })
    const ricardoRow = within(table).getByText('Ricardo Mendes').closest('tr')

    expect(ricardoRow).not.toBeNull()
    expect(
      within(ricardoRow!).getByRole('button', { name: 'Editar Ricardo Mendes' }),
    ).toBeDisabled()
    expect(
      within(ricardoRow!).getByRole('button', { name: 'Ver interações de Ricardo Mendes' }),
    ).toBeDisabled()
    expect(
      within(ricardoRow!).getByRole('button', { name: 'Mais opções para Ricardo Mendes' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Novo Contato' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próximo' })).toBeDisabled()
  })

  it('delegates creation, actions, and pagination when integrations are provided', () => {
    const onNewContact = vi.fn()
    const onEditContact = vi.fn()
    const onOpenInteractions = vi.fn()
    const onOpenMoreOptions = vi.fn()
    const onPageChange = vi.fn()

    renderContactsList({
      onNewContact,
      onEditContact,
      onOpenInteractions,
      onOpenMoreOptions,
      onPageChange,
    })

    const table = screen.getByRole('table', { name: 'Contatos do CRM' })
    const ricardoRow = within(table).getByText('Ricardo Mendes').closest('tr')
    expect(ricardoRow).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Novo Contato' }))
    fireEvent.click(within(ricardoRow!).getByRole('button', { name: 'Editar Ricardo Mendes' }))
    fireEvent.click(
      within(ricardoRow!).getByRole('button', { name: 'Ver interações de Ricardo Mendes' }),
    )
    fireEvent.click(
      within(ricardoRow!).getByRole('button', { name: 'Mais opções para Ricardo Mendes' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))

    expect(onNewContact).toHaveBeenCalledOnce()
    expect(onEditContact).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ricardo Mendes' }))
    expect(onOpenInteractions).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ricardo Mendes' }),
    )
    expect(onOpenMoreOptions).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ricardo Mendes' }),
    )
    expect(onPageChange).toHaveBeenCalledWith(2)
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
  })
})
