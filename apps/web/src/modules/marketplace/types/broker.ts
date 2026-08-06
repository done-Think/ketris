export type BrokerSpecialty = 'Aluguel' | 'Compra' | 'Alto padrão' | 'Comercial'

export type BrokerProfile = {
  id: string
  name: string
  creci: string
  avatar: string
  region: string
  specialties: BrokerSpecialty[]
  activeListings: number
  responseTime: string
  rating: number
  dealsClosed: number
  bio: string
  href: string
}
