import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { ProposalDetail } from '../../components/ProposalDetail'
import {
  featuredProposalId,
  getProposalManagementDetail,
} from '../../fixtures/proposal-management-fixtures'
import type { ProposalDetailProps } from '../../types/proposal-management'

function renderProposalDetail(props: ProposalDetailProps = { proposalId: featuredProposalId }) {
  return render(
    <ThemeProvider theme={theme}>
      <ProposalDetail {...props} />
    </ThemeProvider>,
  )
}

describe('ProposalDetail', () => {
  it('renders the exact reference header and proposal information', () => {
    renderProposalDetail()

    expect(screen.getByRole('link', { name: 'Voltar para propostas' })).toHaveAttribute(
      'href',
      '/crm/proposals',
    )
    expect(screen.getByRole('heading', { name: 'Proposta — Apt Jardins 3q' })).toBeVisible()
    expect(screen.getByText('#PRP-0042')).toBeVisible()
    expect(screen.getAllByText('Em negociação')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Editar' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Enviar ao proprietário' })).toBeVisible()

    const information = screen
      .getByRole('heading', { name: 'Detalhes da Proposta' })
      .closest('section')
    expect(information).not.toBeNull()
    ;[
      'Valor proposto',
      'R$ 4.500/mês',
      'Prazo do contrato',
      '30 meses',
      'Início pretendido',
      '01/03/2025',
      'Garantia contratual',
      'Fiador',
      'Observações',
      'Inquilino prefere incluir vaga de garagem adicional se disponível para locação interna.',
    ].forEach((value) => expect(within(information!).getByText(value)).toBeVisible())
  })

  it('renders the three exact special conditions as a semantic list', () => {
    renderProposalDetail()

    const conditions = screen
      .getByRole('heading', { name: 'Condições Especiais' })
      .closest('section')
    expect(conditions).not.toBeNull()

    const items = within(conditions!).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    ;[
      'Permissão para animais de estimação (2 cães de pequeno porte).',
      'Pintura completa na saída com a mesma marca e código de cores atual.',
      'Desconto de 5% sobre o valor do aluguel para pagamento até o dia 25 de cada mês antecedente.',
    ].forEach((condition) => expect(within(conditions!).getByText(condition)).toBeVisible())
  })

  it('renders the complete lead, property, and broker binding', () => {
    renderProposalDetail()

    const binding = screen.getByRole('heading', { name: 'Vinculação' }).closest('section')
    expect(binding).not.toBeNull()
    ;[
      'Lead interessado',
      'Bruno Oliveira',
      'bruno@fintrex.com',
      'Imóvel',
      'Apt Jardins 3q',
      'Alameda Lorena, 1420',
      'Corretor responsável',
      'Marina Costa',
      'marina.costa@ketris.com',
    ].forEach((value) => expect(within(binding!).getByText(value)).toBeVisible())

    expect(
      within(binding!).getByRole('link', { name: 'Abrir contato de Bruno Oliveira' }),
    ).toHaveAttribute('href', '/crm/contacts')
    expect(
      within(binding!).getByRole('link', { name: 'Abrir imóvel Apt Jardins 3q' }),
    ).toHaveAttribute('href', '/dashboard/imoveis/property-prp-0042')
  })

  it('renders the four-step history and marks only the current state', () => {
    renderProposalDetail()

    const history = screen.getByRole('heading', { name: 'Histórico' }).closest('section')
    expect(history).not.toBeNull()
    expect(within(history!).getAllByRole('listitem')).toHaveLength(4)
    ;[
      'Em negociação',
      'Inquilino solicitou garagem',
      'Hoje, 14:20',
      'Contraproposta recebida',
      'Proprietário alterou condições',
      'Ontem, 11:15',
      'Enviada ao proprietário',
      'Aguardando retorno formal',
      '11 Fev, 09:30',
      'Proposta criada',
      'Por Marina Costa',
      '10 Fev, 17:00',
    ].forEach((value) => expect(within(history!).getByText(value)).toBeVisible())

    const currentSteps = within(history!)
      .getAllByRole('listitem')
      .filter((item) => item.hasAttribute('aria-current'))
    expect(currentSteps).toHaveLength(1)
    expect(currentSteps[0]).toHaveAttribute('aria-current', 'step')
    expect(within(currentSteps[0]).getByText('Em negociação')).toBeVisible()
  })

  it('delegates edit and owner-send actions with the resolved detail', () => {
    const onEdit = vi.fn()
    const onSendToOwner = vi.fn()
    const detail = getProposalManagementDetail(featuredProposalId)
    renderProposalDetail({ proposalId: featuredProposalId, onEdit, onSendToOwner })

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar ao proprietário' }))

    expect(onEdit).toHaveBeenCalledWith(detail)
    expect(onSendToOwner).toHaveBeenCalledWith(detail)
  })

  it('renders a controlled not-found state for an unknown proposal id', () => {
    renderProposalDetail({ proposalId: 'unknown-proposal' })

    expect(screen.getByRole('heading', { name: 'Proposta não encontrada' })).toBeVisible()
    expect(
      screen.getByText('Verifique o endereço ou retorne para a lista de propostas.'),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Voltar para propostas' })).toHaveAttribute(
      'href',
      '/crm/proposals',
    )
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })
})
