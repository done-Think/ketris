import type { MaintenanceTicketDetail } from '../types/maintenance'

export const maintenanceTicketDetail: MaintenanceTicketDetail = {
  code: '#MNT-2025-0089',
  title: 'Vazamento na cozinha',
  property: 'Apt Jardins 3q',
  category: 'Hidráulica',
  openedBy: 'Bruno Oliveira (Locatário)',
  openedAt: '20/02/2025',
  lastUpdated: 'Hoje às 14:00',
  estimatedSla: '24 horas (reparo urgente)',
  estimatedCost: 'R$ 350,00',
  status: 'inProgress',
  priority: 'urgent',
  description:
    'Vazamento embaixo da pia da cozinha, água acumulando no armário. Já fechei o registro mas continuo gotejando. A madeira do móvel está começando a estufar por conta da umidade.',
  responsibles: [
    { name: 'Carlos Eduardo', role: 'Proprietário', initials: 'CE' },
    { name: 'Marina Costa', role: 'Corretor (Ketris)', initials: 'MC' },
    { name: 'João Encanamentos', role: 'Prestador de Serviço', initials: 'JE' },
  ],
  timeline: [
    {
      name: 'Bruno Oliveira',
      role: 'Locatário',
      timestamp: '20/02/2025 • 10:15',
      message:
        'Abri o chamado. A água está começando a vazar bastante por baixo do armário, já danificou um pouco a madeira. Fechei o registro geral temporariamente.',
    },
    {
      name: 'Marina Costa',
      role: 'Corretor (Ketris)',
      timestamp: '20/02/2025 • 11:30',
      message:
        'Bom dia, Bruno! Já aprovei a solicitação e estou encaminhando para o prestador parceiro João Encanamentos! Ele deve entrar em contato em breve para agendar a visita.',
    },
    {
      name: 'João Encanamentos',
      role: 'Prestador',
      timestamp: '20/02/2025 • 14:00',
      message:
        'Olá! Visita agendada para amanhã, dia 21/02 na parte da manhã para efetuar o reparo do sifão e encanamento da cozinha.',
    },
  ],
}
