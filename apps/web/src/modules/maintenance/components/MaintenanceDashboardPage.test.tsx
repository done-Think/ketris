import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { MaintenanceDashboardPage } from './MaintenanceDashboardPage'

describe('MaintenanceDashboardPage', () => {
  it('opens and closes the create ticket dialog from the new ticket button', async () => {
    const user = userEvent.setup()
    render(<MaintenanceDashboardPage />)

    await user.click(screen.getByRole('button', { name: 'Novo Chamado' }))
    expect(screen.getByRole('heading', { name: 'Novo Chamado' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Novo Chamado' })).not.toBeInTheDocument()
    })
  })

  it('adds a valid ticket to the list and closes the dialog', async () => {
    const user = userEvent.setup()
    render(<MaintenanceDashboardPage />)

    await user.click(screen.getByRole('button', { name: 'Novo Chamado' }))
    await user.click(screen.getByLabelText('Imóvel'))
    await user.click(await screen.findByRole('option', { name: 'Apt Jardins 3q' }))
    await user.click(screen.getByLabelText('Categoria'))
    await user.click(await screen.findByRole('option', { name: 'Hidráulica' }))
    await user.type(screen.getByLabelText('Título do Chamado'), 'Vazamento na cozinha')
    await user.type(screen.getByLabelText('Relato do Problema'), 'A pia está vazando.')
    await user.click(screen.getByRole('button', { name: 'Criar Chamado' }))

    expect(await screen.findByText('#MNT-2025-0090')).toBeVisible()
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Novo Chamado' })).not.toBeInTheDocument()
    })
  })
})
