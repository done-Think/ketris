import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getMaintenanceTickets,
  maintenanceTickets,
  setMaintenanceTickets,
} from '../data/maintenance-tickets'
import type { MaintenanceTicket } from '../types/maintenance'
import { MaintenanceDashboardPage } from './MaintenanceDashboardPage'
import { MaintenanceTicketDetailPage } from './MaintenanceTicketDetailPage'
import { getMaintenanceTicketDetail } from '../data/maintenance-ticket-detail'

vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))

describe('MaintenanceDashboardPage', () => {
  beforeEach(() => setMaintenanceTickets(maintenanceTickets))
  afterEach(() => setMaintenanceTickets(maintenanceTickets))

  it.each(['#MNT-2025-0089', '#MNT-2025-0088'])(
    'preserves the content of %s when only priority is edited, including in the detail',
    async (id) => {
      const original = maintenanceTickets.find((ticket) => ticket.id === id)!
      const originalDetail = getMaintenanceTicketDetail(original)
      const user = userEvent.setup()
      const { rerender } = render(<MaintenanceDashboardPage />)

      await user.click(screen.getByRole('button', { name: `Ações do chamado ${id}` }))
      await user.click(screen.getByRole('menuitem', { name: 'Editar chamado' }))
      expect(screen.getByLabelText('Título do Chamado')).toHaveValue(originalDetail.title)
      expect(screen.getByLabelText('Relato do Problema')).toHaveValue(originalDetail.description)
      await user.click(screen.getByLabelText('Prioridade'))
      await user.click(await screen.findByRole('option', { name: 'Normal' }))
      await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      const updated = getMaintenanceTickets().find((ticket) => ticket.id === id)!
      expect(updated).toEqual({
        ...original,
        priority: 'normal',
        title: originalDetail.title,
        description: originalDetail.description,
      })
      expect(getMaintenanceTickets().filter((ticket) => ticket.id !== id)).toEqual(
        maintenanceTickets.filter((ticket) => ticket.id !== id),
      )
      const row = screen.getByText(id).closest('tr')!
      expect(within(row).getByText('Normal')).toBeVisible()
      expect(within(row).getByRole('link')).toHaveAttribute(
        'href',
        `/dashboard/maintenance/${id.slice(1)}`,
      )

      rerender(<MaintenanceTicketDetailPage ticketId={id} />)
      expect(screen.getByText(id)).toBeVisible()
      expect(screen.getByText(originalDetail.title)).toBeVisible()
      expect(screen.getByText(originalDetail.description)).toBeVisible()
      expect(screen.getByText(original.property)).toBeVisible()
      expect(screen.getByText('Normal')).toBeVisible()
    },
  )

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

  it('filters tickets by property', async () => {
    const user = userEvent.setup()
    render(<MaintenanceDashboardPage />)

    const [propertySelect] = screen.getAllByRole('combobox')
    await user.click(propertySelect)
    await user.click(await screen.findByRole('option', { name: 'Casa Vila Madalena' }))

    expect(screen.getByText('#MNT-2025-0087')).toBeVisible()
    expect(screen.queryByText('#MNT-2025-0089')).not.toBeInTheDocument()
  })

  it('opens the mobile filters dialog and applies a status filter', async () => {
    const user = userEvent.setup()
    render(<MaintenanceDashboardPage />)

    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    const dialog = screen.getByRole('dialog', { name: 'Filtros' })
    expect(dialog).toBeVisible()

    await user.click(within(dialog).getByRole('combobox', { name: 'Filtros' }))
    await user.click(await screen.findByRole('option', { name: /^Urgente/ }))

    expect(screen.getByText('#MNT-2025-0089')).toBeVisible()
    expect(screen.queryByText('#MNT-2025-0088')).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Fechar filtros' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Filtros' })).not.toBeInTheDocument(),
    )
  })

  it('paginates the locally available tickets', async () => {
    const extraTicket: MaintenanceTicket = {
      ...maintenanceTickets[5],
      id: '#MNT-2025-0083',
    }
    setMaintenanceTickets([...maintenanceTickets, extraTicket])
    const user = userEvent.setup()
    render(<MaintenanceDashboardPage />)

    expect(screen.queryByText('#MNT-2025-0083')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(screen.getByText('#MNT-2025-0083')).toBeVisible()
    expect(screen.getByRole('button', { name: /previous page/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled()
  })

  it('saves edits to the selected ticket', async () => {
    const user = userEvent.setup()
    render(<MaintenanceDashboardPage />)

    await user.click(screen.getByRole('button', { name: 'Ações do chamado #MNT-2025-0089' }))
    await user.click(screen.getByRole('menuitem', { name: 'Editar chamado' }))
    const title = screen.getByLabelText('Título do Chamado')
    await user.clear(title)
    await user.type(title, 'Vazamento atualizado')
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

    expect(getMaintenanceTickets().find((ticket) => ticket.id === '#MNT-2025-0089')?.title).toBe(
      'Vazamento atualizado',
    )
  })

  it('removes the selected ticket after confirmation', async () => {
    const user = userEvent.setup()
    render(<MaintenanceDashboardPage />)

    await user.click(screen.getByRole('button', { name: 'Ações do chamado #MNT-2025-0089' }))
    await user.click(screen.getByRole('menuitem', { name: 'Excluir chamado' }))
    await user.click(screen.getByRole('button', { name: 'Excluir chamado' }))

    await waitFor(() => {
      expect(screen.queryByText('#MNT-2025-0089')).not.toBeInTheDocument()
    })
  })
})
