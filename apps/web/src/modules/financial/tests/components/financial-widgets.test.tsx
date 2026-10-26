import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ChargeStatusChip } from '../../components/ChargeStatusChip'
import { FinancialEntriesTable } from '../../components/FinancialEntriesTable'
import { FinancialKpiCards } from '../../components/FinancialKpiCards'
import { ReceiptFileField } from '../../components/ReceiptFileField'
import { renderWithProviders } from '../fixtures/render'

describe('financial widgets', () => {
  it('labels every charge status, including the derived overdue one', () => {
    for (const [status, label] of [
      ['pending', 'Pendente'],
      ['overdue', 'Atrasada'],
      ['paid', 'Paga'],
      ['scheduled', 'Agendada'],
      ['cancelled', 'Cancelada'],
    ] as const) {
      const { unmount } = renderWithProviders(<ChargeStatusChip status={status} />)
      expect(screen.getByText(label)).toBeVisible()
      unmount()
    }
  })

  it('renders the KPI cards with translated labels', () => {
    renderWithProviders(
      <FinancialKpiCards
        kpis={[{ id: 'receivable', labelKey: 'receivable', value: 'R$ 10,00', tone: 'info' }]}
      />,
    )
    expect(screen.getByText('A receber')).toBeVisible()
    expect(screen.getByText('R$ 10,00')).toBeVisible()
  })

  it('opens the charge when an entry row is clicked and signs payable amounts', async () => {
    const onOpen = vi.fn()
    renderWithProviders(
      <FinancialEntriesTable
        onOpen={onOpen}
        entries={[
          {
            id: 'charge-7',
            date: '2026-10-10',
            description: 'Manutenção',
            property: 'Studio Pinheiros',
            client: 'Mariana',
            amountValue: -350,
            status: 'pending',
          },
        ]}
      />,
    )
    const row = (await screen.findByText('Manutenção')).closest('[role="row"]') as HTMLElement
    expect(within(row).getByText(/^-R\$\s350,00$/)).toBeVisible()
    await userEvent.click(row)
    expect(onOpen).toHaveBeenCalledWith('charge-7')
  })

  it('lets the user attach and remove a receipt', async () => {
    const onChange = vi.fn()
    const file = new File(['%PDF'], 'comprovante.pdf', { type: 'application/pdf' })
    const { rerender } = renderWithProviders(<ReceiptFileField file={null} onChange={onChange} />)

    expect(screen.getByText('Nenhum comprovante anexado (opcional)')).toBeVisible()
    expect(screen.getByText('PDF, JPG ou PNG até 10 MB.')).toBeVisible()
    await userEvent.upload(screen.getByLabelText('Anexar comprovante'), file)
    expect(onChange).toHaveBeenCalledWith(file)

    rerender(<ReceiptFileField file={file} error="Erro de teste" onChange={onChange} />)
    expect(screen.getByText('Erro de teste')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Remover' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
  })
})
