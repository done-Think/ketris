export type AgendaEventStatus = 'Confirmada' | 'Pendente' | 'Reagendar'

export type AgendaEvent = {
  id: string
  time: string
  title: string
  property: string
  participant: string
  status: AgendaEventStatus
}
