import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MaintenanceTicketsTable } from '../../components/MaintenanceTicketsTable'
import type { MaintenanceTicket } from '../../types/maintenance'

const ticket: MaintenanceTicket = {
  id: 'MNT-1',
  propertyId: 'p1',
  property: 'Apto Centro',
  category: 'PLUMBING',
  priority: 'urgent',
  tenant: 'Locatário Silva',
  openedAt: '2026-10-01',
  status: 'open',
  title: 'Vazamento na cozinha',
  permissions: {
    edit: true,
    delete: false,
  } as MaintenanceTicket['permissions'],
}

function renderTable(tickets: MaintenanceTicket[], onOpenMenu = vi.fn()) {
  render(
    <MaintenanceTicketsTable
      pagedTickets={tickets}
      totalCount={tickets.length}
      currentPage={0}
      rowsPerPage={10}
      setCurrentPage={vi.fn()}
      onRowsPerPageChange={vi.fn()}
      onOpenMenu={onOpenMenu}
    />,
  )
  return { onOpenMenu }
}

describe('MaintenanceTicketsTable', () => {
  it('shows the ticket row with the translated category and a link to the detail', () => {
    renderTable([ticket])

    expect(screen.getByText('Apto Centro')).toBeInTheDocument()
    expect(screen.getByText('Locatário Silva')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Vazamento na cozinha/ })).toHaveAttribute(
      'href',
      expect.stringContaining('MNT-1'),
    )
  })

  it('shows the ticket title instead of the internal id', () => {
    renderTable([ticket])

    expect(screen.getByRole('cell', { name: 'Vazamento na cozinha' })).toBeInTheDocument()
    expect(screen.queryByText('MNT-1')).not.toBeInTheDocument()
  })

  it('opens the action menu only when the user can edit or delete', async () => {
    const user = userEvent.setup()
    const { onOpenMenu } = renderTable([ticket])

    await user.click(screen.getByRole('button', { name: /Vazamento na cozinha/ }))
    expect(onOpenMenu).toHaveBeenCalledWith(expect.any(HTMLElement), 'MNT-1')
  })

  it('hides the action menu without permissions', () => {
    renderTable([{ ...ticket, permissions: undefined }])

    expect(screen.queryByRole('button', { name: /Vazamento na cozinha/ })).not.toBeInTheDocument()
  })

  it('shows the empty message when there are no tickets', () => {
    renderTable([])

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByText('Apto Centro')).not.toBeInTheDocument()
  })
})
