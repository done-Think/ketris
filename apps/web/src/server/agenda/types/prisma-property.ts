export interface AgendaPropertyRecord {
  id: string
  titulo: string
  endereco: { bairro: string; cidade: string } | null
}
