import type { DashboardLead } from '../types/lead'

export const dashboardLeads: DashboardLead[] = [
  {
    id: 'lead-001',
    name: 'João Silva',
    lastContact: 'Há 30 min',
    interest: 'Apartamento 3 quartos nos Jardins',
    source: 'Marketplace',
    broker: 'Roberto Souza',
    stage: 'Novo',
  },
  {
    id: 'lead-002',
    name: 'Maria Fernandes',
    lastContact: 'Há 2 horas',
    interest: 'Studio mobiliado em Pinheiros',
    source: 'WhatsApp',
    broker: 'Ana Paula',
    stage: 'Em contato',
  },
  {
    id: 'lead-003',
    name: 'Rafael Lima',
    lastContact: 'Ontem',
    interest: 'Casa Alto de Pinheiros',
    source: 'Indicação',
    broker: 'Marcos Lima',
    stage: 'Visita marcada',
  },
  {
    id: 'lead-004',
    name: 'Carla Rocha',
    lastContact: 'Há 3 dias',
    interest: 'Cobertura Itaim Bibi',
    source: 'Site',
    broker: 'Clara G.',
    stage: 'Proposta',
  },
]
