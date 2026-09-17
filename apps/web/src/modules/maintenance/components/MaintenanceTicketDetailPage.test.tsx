import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { maintenanceTickets, setMaintenanceTickets } from '../data/maintenance-tickets'
import { maintenanceTicketDetail } from '../data/maintenance-ticket-detail'
import { MaintenanceTicketDetailPage } from './MaintenanceTicketDetailPage'

describe('MaintenanceTicketDetailPage', () => {
  beforeEach(() => setMaintenanceTickets(maintenanceTickets))
  afterEach(() => setMaintenanceTickets(maintenanceTickets))

  it.each([
    [
      '#MNT-2025-0089',
      'Apt Jardins 3q',
      'Hidráulica',
      'Bruno Oliveira',
      'Em andamento',
      'Urgente',
      '20/02/2025',
    ],
    [
      '#MNT-2025-0088',
      'Studio Pinheiros',
      'Elétrica',
      'Mariana Souza',
      'Aberto',
      'Alta',
      '19/02/2025',
    ],
    [
      '#MNT-2025-0087',
      'Casa Vila Madalena',
      'Estrutural',
      'Felipe Neto',
      'Em andamento',
      'Alta',
      '18/02/2025',
    ],
  ])(
    'renders the actual details for %s',
    (id, property, category, tenant, status, priority, date) => {
      render(<MaintenanceTicketDetailPage ticketId={id} />)

      expect(screen.getByText(id)).toBeVisible()
      expect(screen.getByText(property)).toBeVisible()
      expect(screen.getByText(category)).toBeVisible()
      expect(screen.getByText(`${tenant} (Locatário)`)).toBeVisible()
      expect(screen.getByText(status)).toBeVisible()
      expect(screen.getByText(priority)).toBeVisible()
      const openingRow = screen.getByText('Data abertura').parentElement!
      expect(
        within(openingRow).getByText(id.endsWith('0089') ? `${date} às 10:15` : date),
      ).toBeVisible()
      const updatedRow = screen.getByText('Última atualização').parentElement!
      expect(
        within(updatedRow).getByText(id.endsWith('0089') ? 'Hoje às 14:00' : date),
      ).toBeVisible()

      if (id.endsWith('0089')) {
        expect(screen.getByText(maintenanceTicketDetail.title)).toBeVisible()
        expect(screen.getByText(maintenanceTicketDetail.description)).toBeVisible()
        expect(screen.getByText('pia_cozinha1.jpg')).toBeVisible()
        expect(screen.getByText('armario_vazado.jpg')).toBeVisible()
        expect(screen.getByText('Carlos Eduardo')).toBeVisible()
        expect(screen.getByText(maintenanceTicketDetail.timeline[0].message)).toBeVisible()
      } else {
        expect(screen.getByText(`Chamado de ${category}`)).toBeVisible()
        expect(screen.queryByText('pia_cozinha1.jpg')).not.toBeInTheDocument()
        expect(screen.queryByText('armario_vazado.jpg')).not.toBeInTheDocument()
        expect(screen.queryByText('Carlos Eduardo')).not.toBeInTheDocument()
        expect(
          screen.queryByText(maintenanceTicketDetail.timeline[0].message),
        ).not.toBeInTheDocument()
        expect(screen.queryByText('Urgente')).not.toBeInTheDocument()
      }
    },
  )

  it('renders the ticket that matches the route id', () => {
    render(<MaintenanceTicketDetailPage ticketId="#MNT-2025-0088" />)

    expect(screen.getByText('#MNT-2025-0088')).toBeVisible()
    expect(screen.queryByText('#MNT-2025-0089')).not.toBeInTheDocument()
    expect(screen.queryByText('Custo estimado')).not.toBeInTheDocument()
    expect(screen.getByText('SLA estimado')).toBeVisible()
  })

  it('renders a not-found state for an unknown ticket id', () => {
    render(<MaintenanceTicketDetailPage ticketId="#MNT-2025-9999" />)

    expect(screen.getByText('Chamado não encontrado')).toBeVisible()
    expect(screen.queryByText('#MNT-2025-0089')).not.toBeInTheDocument()
  })
})
