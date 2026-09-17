import type { MaintenanceFilter, MaintenanceMetric, MaintenanceTicket } from '../types/maintenance'

export const maintenanceTickets: readonly MaintenanceTicket[] = [
  {
    id: '#MNT-2025-0089',
    property: 'Apt Jardins 3q',
    category: 'Hidr\u00e1ulica',
    priority: 'urgent',
    tenant: 'Bruno Oliveira',
    openedAt: '20/02/2025',
    status: 'inProgress',
  },
  {
    id: '#MNT-2025-0088',
    property: 'Studio Pinheiros',
    category: 'El\u00e9trica',
    priority: 'high',
    tenant: 'Mariana Souza',
    openedAt: '19/02/2025',
    status: 'open',
  },
  {
    id: '#MNT-2025-0087',
    property: 'Casa Vila Madalena',
    category: 'Estrutural',
    priority: 'high',
    tenant: 'Felipe Neto',
    openedAt: '18/02/2025',
    status: 'inProgress',
  },
  {
    id: '#MNT-2025-0086',
    property: 'Cobertura Moema',
    category: 'Pintura',
    priority: 'normal',
    tenant: 'Aline Santos',
    openedAt: '15/02/2025',
    status: 'resolved',
  },
  {
    id: '#MNT-2025-0085',
    property: 'Apt Jardins 3q',
    category: 'El\u00e9trica',
    priority: 'normal',
    tenant: 'Bruno Oliveira',
    openedAt: '10/02/2025',
    status: 'closed',
  },
  {
    id: '#MNT-2025-0084',
    property: 'Studio Pinheiros',
    category: 'Hidr\u00e1ulica',
    priority: 'high',
    tenant: 'Mariana Souza',
    openedAt: '08/02/2025',
    status: 'resolved',
  },
]

let currentMaintenanceTickets: readonly MaintenanceTicket[] = maintenanceTickets

export function getMaintenanceTickets() {
  return currentMaintenanceTickets
}

export function setMaintenanceTickets(tickets: readonly MaintenanceTicket[]) {
  currentMaintenanceTickets = tickets
}

export const maintenanceMetrics: readonly MaintenanceMetric[] = [
  { label: 'open', value: '12' },
  { label: 'urgent', value: '3' },
  { label: 'averageResolution', value: '4.2 dias' },
]

export const maintenanceFilters: readonly MaintenanceFilter[] = [
  { value: 'all', count: 34 },
  { value: 'open', count: 12 },
  { value: 'inProgress', count: 8 },
  { value: 'urgent', count: 3 },
  { value: 'resolved', count: 9 },
  { value: 'closed', count: 2 },
]
