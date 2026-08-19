import type { AgendaEvent } from '../types/agenda-event'

export const agendaEvents: AgendaEvent[] = [
  {
    id: 'agenda-001',
    time: '09:30',
    title: 'Visita ao imóvel',
    property: 'Apartamento Alameda Jardins',
    participant: 'João Silva',
    status: 'Confirmada',
  },
  {
    id: 'agenda-002',
    time: '13:00',
    title: 'Retorno comercial',
    property: 'Studio Vila Madalena',
    participant: 'Maria Fernandes',
    status: 'Pendente',
  },
  {
    id: 'agenda-003',
    time: '16:30',
    title: 'Assinatura de proposta',
    property: 'Casa Alto da Boa Vista',
    participant: 'Rafael Lima',
    status: 'Reagendar',
  },
]
