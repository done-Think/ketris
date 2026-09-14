import type {
  AgendaEvent,
  AgendaEventSeed,
  AgendaTimeSlot,
  AgendaTranslationGetter,
} from '../types/agenda-event'

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

const agendaEventSeeds: AgendaEventSeed[] = [
  {
    id: 'agenda-001',
    scheduledDate: getAgendaDate(0),
    time: '09:00',
    durationMinutes: 60,
    titleKey: 'sampleEvents.jardimVisit.title',
    propertyKey: 'sampleEvents.jardimVisit.property',
    propertyHref: '/dashboard/properties/apt-jardins-3q',
    participant: 'Ana Nóbrega',
    phone: '(11) 99842-2109',
    notesKey: 'sampleEvents.jardimVisit.notes',
    status: 'Confirmada',
    tone: 'primary',
    kind: 'visit',
    createdBy: 'Roberto Souza',
    createdByRole: 'colleague',
  },
  {
    id: 'agenda-002',
    scheduledDate: getAgendaDate(0),
    time: '14:30',
    durationMinutes: 45,
    titleKey: 'sampleEvents.proposalReturn.title',
    propertyKey: 'sampleEvents.proposalReturn.property',
    propertyHref: '/dashboard/properties/cobertura-itaim',
    participant: 'Marcos Lima',
    phone: '(11) 98731-4402',
    notesKey: 'sampleEvents.proposalReturn.notes',
    status: 'Pendente',
    tone: 'warning',
    kind: 'followUp',
  },
  {
    id: 'agenda-003',
    scheduledDate: getAgendaDate(2),
    time: '10:30',
    durationMinutes: 60,
    titleKey: 'sampleEvents.intakeMeeting.title',
    propertyKey: 'sampleEvents.intakeMeeting.property',
    propertyHref: '/dashboard/properties/casa-alto-pinheiros',
    participant: 'Helena Prado',
    phone: '(11) 99420-8810',
    notesKey: 'sampleEvents.intakeMeeting.notes',
    status: 'Confirmada',
    tone: 'info',
    kind: 'meeting',
    createdBy: 'Lopes Jardins',
    createdByRole: 'agency',
  },
  {
    id: 'agenda-004',
    scheduledDate: getAgendaDate(6),
    time: '11:00',
    durationMinutes: 75,
    titleKey: 'sampleEvents.entryInspection.title',
    propertyKey: 'sampleEvents.entryInspection.property',
    propertyHref: '/dashboard/properties/studio-pinheiros',
    participant: 'Bruno Oliveira',
    phone: '(11) 99618-3321',
    notesKey: 'sampleEvents.entryInspection.notes',
    status: 'Confirmada',
    tone: 'primary',
    kind: 'inspection',
  },
  {
    id: 'agenda-005',
    scheduledDate: getAgendaDate(8),
    time: '16:00',
    durationMinutes: 45,
    titleKey: 'sampleEvents.financingFollowUp.title',
    propertyKey: 'sampleEvents.financingFollowUp.property',
    propertyHref: '/dashboard/properties/apt-jardins-3q',
    participant: 'Laura Martins',
    phone: '(11) 98244-6901',
    notesKey: 'sampleEvents.financingFollowUp.notes',
    status: 'Pendente',
    tone: 'warning',
    kind: 'followUp',
  },
  {
    id: 'agenda-006',
    scheduledDate: getAgendaDate(13),
    time: '13:30',
    durationMinutes: 60,
    titleKey: 'sampleEvents.digitalSignature.title',
    propertyKey: 'sampleEvents.digitalSignature.property',
    propertyHref: '/dashboard/contracts/contract-002',
    participant: 'Mariana Costa',
    phone: '(11) 99172-0045',
    notesKey: 'sampleEvents.digitalSignature.notes',
    status: 'Reagendar',
    tone: 'info',
    kind: 'signature',
    createdBy: 'Mariana Costa',
    createdByRole: 'colleague',
  },
]

export function getAgendaEvents(t: AgendaTranslationGetter): AgendaEvent[] {
  return agendaEventSeeds.map(({ notesKey, propertyKey, titleKey, ...event }) => ({
    ...event,
    notes: t(notesKey),
    property: t(propertyKey),
    title: t(titleKey),
  }))
}
