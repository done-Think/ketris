import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ActivityDetailModal } from '../../components/ActivityDetailModal'
import { upcomingActivity } from '../fixtures/dashboard'
import { renderWithProviders } from '../fixtures/render'

describe('ActivityDetailModal', () => {
  it('não abre sem atividade', () => {
    renderWithProviders(<ActivityDetailModal activity={null} onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mostra horário, local, cliente e o card do imóvel', () => {
    renderWithProviders(<ActivityDetailModal activity={upcomingActivity} onClose={vi.fn()} />)

    expect(screen.getByText('Horário de encontro')).toBeInTheDocument()
    expect(screen.getByText('Apto Batel')).toBeInTheDocument()
    expect(screen.getAllByText('Ana').length).toBeGreaterThan(0)
    expect(screen.getByText('Sem observações registradas.')).toBeInTheDocument()
    expect(screen.getByText('Apartamento Batel')).toBeInTheDocument()
    expect(screen.getByText('Rua Bispo, 10 - Batel, Curitiba')).toBeInTheDocument()
    expect(screen.getByText(/3\.200,00/)).toBeInTheDocument()
  })

  it('esconde o card do imóvel quando o endpoint não manda o resumo', () => {
    renderWithProviders(
      <ActivityDetailModal
        activity={{
          ...upcomingActivity,
          property: null,
          propertyReference: null,
          notes: 'Levar chaves',
        }}
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByText('Imóvel da visita')).not.toBeInTheDocument()
    expect(screen.queryByText('Local')).not.toBeInTheDocument()
    expect(screen.getByText('Levar chaves')).toBeInTheDocument()
  })

  it('fecha pelo botão', async () => {
    const onClose = vi.fn()
    renderWithProviders(<ActivityDetailModal activity={upcomingActivity} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onClose).toHaveBeenCalled()
  })
})
