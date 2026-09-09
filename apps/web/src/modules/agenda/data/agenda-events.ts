import type { AgendaEvent, AgendaTimeSlot } from '../types/agenda-event'

const currentAgendaDay = new Date()
const currentAgendaDate = new Date(
  currentAgendaDay.getFullYear(),
  currentAgendaDay.getMonth(),
  currentAgendaDay.getDate(),
)

function getAgendaDate(daysFromCurrentDate: number) {
  const date = new Date(currentAgendaDate)
  date.setDate(currentAgendaDate.getDate() + daysFromCurrentDate)

  return date.toISOString().slice(0, 10)
}

export const agendaTimeSlots: AgendaTimeSlot[] = [
  { label: '08:00', hour: 8 },
  { label: '09:00', hour: 9 },
  { label: '10:00', hour: 10 },
  { label: '11:00', hour: 11 },
  { label: '12:00', hour: 12 },
  { label: '13:00', hour: 13 },
  { label: '14:00', hour: 14 },
  { label: '15:00', hour: 15 },
  { label: '16:00', hour: 16 },
  { label: '17:00', hour: 17 },
  { label: '18:00', hour: 18 },
]

export const agendaEvents: AgendaEvent[] = [
  {
    id: 'agenda-001',
    scheduledDate: getAgendaDate(0),
    time: '09:00',
    durationMinutes: 60,
    title: 'Visita Jardim Paulista',
    property: 'Apartamento Jardim Paulista',
    propertyHref: '/dashboard/properties/apt-jardins-3q',
    participant: 'Ana Nóbrega',
    phone: '(11) 99842-2109',
    notes: 'Cliente quer validar luminosidade da sala e vaga de garagem antes de enviar proposta.',
    status: 'Confirmada',
    tone: 'primary',
    createdBy: 'Roberto Souza',
    createdByRole: 'Colega',
  },
  {
    id: 'agenda-002',
    scheduledDate: getAgendaDate(0),
    time: '14:30',
    durationMinutes: 45,
    title: 'Retorno proposta',
    property: 'Cobertura Itaim Bibi',
    propertyHref: '/dashboard/properties/cobertura-itaim',
    participant: 'Marcos Lima',
    phone: '(11) 98731-4402',
    notes: 'Enviar comparativo de preço e confirmar margem para contraproposta.',
    status: 'Pendente',
    tone: 'warning',
  },
  {
    id: 'agenda-003',
    scheduledDate: getAgendaDate(2),
    time: '10:30',
    durationMinutes: 60,
    title: 'Reunião captação',
    property: 'Casa Alto da Lapa',
    propertyHref: '/dashboard/properties/casa-alto-pinheiros',
    participant: 'Helena Prado',
    phone: '(11) 99420-8810',
    notes: 'Alinhar exclusividade, prazo de publicação e estratégia de fotos.',
    status: 'Confirmada',
    tone: 'info',
    createdBy: 'Lopes Jardins',
    createdByRole: 'Imobiliária',
  },
  {
    id: 'agenda-004',
    scheduledDate: getAgendaDate(6),
    time: '11:00',
    durationMinutes: 75,
    title: 'Vistoria de entrada',
    property: 'Studio Vila Madalena',
    propertyHref: '/dashboard/properties/studio-pinheiros',
    participant: 'Bruno Oliveira',
    phone: '(11) 99618-3321',
    notes: 'Conferir pintura, checklist de chaves e leitura inicial de medidores.',
    status: 'Confirmada',
    tone: 'primary',
  },
  {
    id: 'agenda-005',
    scheduledDate: getAgendaDate(8),
    time: '16:00',
    durationMinutes: 45,
    title: 'Follow-up financiamento',
    property: 'Apartamento Jardins',
    propertyHref: '/dashboard/properties/apt-jardins-3q',
    participant: 'Laura Martins',
    phone: '(11) 98244-6901',
    notes: 'Acompanhar retorno do banco e documentos pendentes do comprador.',
    status: 'Pendente',
    tone: 'warning',
  },
  {
    id: 'agenda-006',
    scheduledDate: getAgendaDate(13),
    time: '13:30',
    durationMinutes: 60,
    title: 'Assinatura digital',
    property: 'Contrato Studio Pinheiros',
    propertyHref: '/dashboard/contracts/contract-002',
    participant: 'Mariana Costa',
    phone: '(11) 99172-0045',
    notes: 'Reagendar com fiador e locatária no mesmo horário para concluir assinatura.',
    status: 'Reagendar',
    tone: 'info',
    createdBy: 'Mariana Costa',
    createdByRole: 'Colega',
  },
]
