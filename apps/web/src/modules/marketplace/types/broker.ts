export type BrokerSpecialty = 'Aluguel' | 'Compra' | 'Alto padrão' | 'Comercial'

export type BrokerProfile = {
  id: string
  name: string
  creci: string
  avatar: string
  region: string
  specialties: BrokerSpecialty[]
  neighborhoods: string[]
  activeListings: number
  responseTime: string
  rating: number
  dealsClosed: number
  phone: string
  email: string
  availability: string
  bio: string
  href: string
  highlightedListings: Array<{
    title: string
    location: string
    price: string
    href: string
  }>
}

export type BrokerCardProps = BrokerProfile & {
  onOpenProfile: () => void
}

export type BrokerProfileModalProps = {
  open: boolean
  broker: BrokerProfile | null
  onClose: () => void
}
