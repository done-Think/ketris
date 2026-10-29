export interface AgendaPropertyRecord {
  id: string
  title: string
  address: { neighborhood: string; city: string } | null
}
