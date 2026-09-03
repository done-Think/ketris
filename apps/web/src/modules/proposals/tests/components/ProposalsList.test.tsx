import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { ProposalsList } from '../../components/ProposalsList'
import type { ProposalsListProps } from '../../types/proposal-management'

function renderProposalsList(props: ProposalsListProps = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <ProposalsList {...props} />
    </ThemeProvider>,
  )
}

describe('ProposalsList', () => {
  it('renders the complete first-page reference and proposal indicators', () => {
    renderProposalsList()

    expect(screen.getByRole('heading', { name: 'Propostas' })).toBeVisible()
    expect(screen.getByText('Gerencie propostas vinculadas a leads e imóveis')).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Buscar propostas' })).toHaveAttribute(
      'placeholder',
      'Buscar proposta...',
    )
    expect(screen.getByRole('button', { name: 'Nova Proposta' })).toBeVisible()

    const filters = screen.getByRole('group', { name: 'Filtrar propostas por status' })
    ;[
      ['Todas 23', 'true'],
      ['Em negociação 8', 'false'],
      ['Enviada 6', 'false'],
      ['Aceita 4', 'false'],
      ['Recusada 3', 'false'],
      ['Rascunho 2', 'false'],
    ].forEach(([name, pressed]) => {
      expect(within(filters).getByRole('button', { name })).toHaveAttribute('aria-pressed', pressed)
    })

    const indicators = screen.getByLabelText('Indicadores de propostas')
    expect(within(indicators).getByText('Em negociação')).toBeVisible()
    expect(within(indicators).getByText('8')).toBeVisible()
    expect(within(indicators).getByText('Valor total aceitas')).toBeVisible()
    expect(within(indicators).getByText('R$ 2.4M')).toBeVisible()
    expect(within(indicators).getByText('Taxa de conversão')).toBeVisible()
    expect(within(indicators).getByText('38%')).toBeVisible()

    const table = screen.getByRole('table', { name: 'Propostas do CRM' })
    expect(within(table).getAllByRole('row')).toHaveLength(6)
    ;['Proposta', 'Lead', 'Imóvel', 'Valor', 'Status', 'Criada', 'Ações'].forEach((heading) =>
      expect(within(table).getByText(heading)).toBeInTheDocument(),
    )

    const brunoRow = within(table).getByText('#PRP-0042').closest('tr')
    expect(brunoRow).not.toBeNull()
    ;[
      'Bruno Oliveira',
      'bruno@fintrex.com',
      'Apt Jardins 3q',
      'Alameda Lorena, 1420',
      'R$ 4.500/mês',
      'Em negociação',
      '12 Fev 2025',
    ].forEach((value) => expect(within(brunoRow!).getByText(value)).toBeVisible())

    expect(within(table).getByText('#PRP-0041')).toBeVisible()
    expect(within(table).getByText('#PRP-0040')).toBeVisible()
    expect(within(table).getByText('#PRP-0039')).toBeVisible()
    expect(within(table).getByText('#PRP-0038')).toBeVisible()
    expect(screen.getByText('Exibindo 5 de 23 propostas')).toBeVisible()
  })

  it('combines normalized search and status filtering and resets the active page', () => {
    renderProposalsList({ initialPage: 2 })

    expect(screen.getByRole('button', { name: 'Ir para página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar propostas' }), {
      target: { value: 'apartamento' },
    })
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Filtrar propostas por status' })).getByRole(
        'button',
        { name: 'Enviada 6' },
      ),
    )

    const table = screen.getByRole('table', { name: 'Propostas do CRM' })
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(within(table).getByText('#PRP-0030')).toBeVisible()
    expect(within(table).getByText('#PRP-0027')).toBeVisible()
    expect(within(table).queryByText('#PRP-0040')).not.toBeInTheDocument()
    expect(screen.getByText('Exibindo 2 de 2 propostas')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Ir para página 1' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('paginates the real 23-item collection and delegates page changes', () => {
    const onPageChange = vi.fn()
    renderProposalsList({ onPageChange })

    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeEnabled()
    ;[1, 2, 3, 4].forEach((page) =>
      expect(screen.getByRole('button', { name: `Ir para página ${page}` })).toBeVisible(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ir para página 2' }))

    expect(onPageChange).toHaveBeenCalledWith(2)
    expect(screen.getByRole('button', { name: 'Ir para página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    const table = screen.getByRole('table', { name: 'Propostas do CRM' })
    expect(within(table).getByText('#PRP-0037')).toBeVisible()
    expect(within(table).getByText('#PRP-0033')).toBeVisible()
    expect(within(table).queryByText('#PRP-0042')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(onPageChange).toHaveBeenLastCalledWith(3)
  })

  it('exposes only the requested row actions and delegates available integrations', () => {
    const onNewProposal = vi.fn()
    const onViewProposal = vi.fn()
    const onOpenMoreOptions = vi.fn()

    renderProposalsList({ onNewProposal, onViewProposal, onOpenMoreOptions })

    fireEvent.click(screen.getByRole('button', { name: 'Nova Proposta' }))

    const table = screen.getByRole('table', { name: 'Propostas do CRM' })
    const brunoRow = within(table).getByText('#PRP-0042').closest('tr')
    expect(brunoRow).not.toBeNull()
    const viewAction = within(brunoRow!).getByRole('link', { name: 'Visualizar #PRP-0042' })
    const moreAction = within(brunoRow!).getByRole('button', {
      name: 'Mais opções para #PRP-0042',
    })

    expect(viewAction).toHaveAttribute('href', '/crm/proposals/prp-0042')
    expect(within(brunoRow!).getAllByRole('link')).toHaveLength(1)
    expect(within(brunoRow!).getAllByRole('button')).toHaveLength(1)

    viewAction.addEventListener('click', (event) => event.preventDefault())
    fireEvent.click(viewAction)
    fireEvent.click(moreAction)

    expect(onNewProposal).toHaveBeenCalledOnce()
    expect(onViewProposal).toHaveBeenCalledWith(expect.objectContaining({ id: 'prp-0042' }))
    expect(onOpenMoreOptions).toHaveBeenCalledWith(expect.objectContaining({ id: 'prp-0042' }))
  })

  it('keeps equivalent desktop and mobile structures backed by the same page', () => {
    renderProposalsList()

    const table = screen.getByRole('table', { name: 'Propostas do CRM' })
    const mobileList = screen.getByLabelText('Lista móvel de propostas')
    const references = ['#PRP-0042', '#PRP-0041', '#PRP-0040', '#PRP-0039', '#PRP-0038']

    references.forEach((reference) => {
      expect(within(table).getByText(reference)).toBeInTheDocument()
      expect(within(mobileList).getByText(reference)).toBeInTheDocument()
    })
  })

  it('renders a truthful empty state and unavailable optional controls', () => {
    renderProposalsList({ proposals: [] })

    expect(screen.getByText('Nenhuma proposta encontrada.')).toBeVisible()
    expect(screen.queryByRole('table', { name: 'Propostas do CRM' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Lista móvel de propostas')).not.toBeInTheDocument()
    expect(screen.getByText('Exibindo 0 de 0 propostas')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Nova Proposta' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
  })
})
