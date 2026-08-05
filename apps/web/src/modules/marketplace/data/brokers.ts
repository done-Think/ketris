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

export const brokers: BrokerProfile[] = [
  {
    id: 'marina-costa',
    name: 'Marina Costa',
    creci: 'CRECI 123456-F',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    region: 'Jardins, São Paulo',
    specialties: ['Aluguel', 'Alto padrão'],
    activeListings: 42,
    responseTime: '15 min',
    rating: 4.9,
    dealsClosed: 128,
    bio: 'Atuação focada em apartamentos prontos para morar nos Jardins, Itaim Bibi e região da Paulista.',
    href: '/corretores?corretor=marina-costa',
  },
  {
    id: 'thiago-santos',
    name: 'Thiago Santos',
    creci: 'CRECI 098742-F',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    region: 'Vila Madalena, São Paulo',
    specialties: ['Compra', 'Aluguel'],
    activeListings: 31,
    responseTime: '20 min',
    rating: 4.8,
    dealsClosed: 96,
    bio: 'Especialista em studios, lofts e apartamentos compactos na zona oeste de São Paulo.',
    href: '/corretores?corretor=thiago-santos',
  },
  {
    id: 'juliana-mendes',
    name: 'Juliana Mendes',
    creci: 'CRECI 221908-F',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    region: 'Itaim Bibi, São Paulo',
    specialties: ['Compra', 'Alto padrão'],
    activeListings: 54,
    responseTime: '10 min',
    rating: 5,
    dealsClosed: 174,
    bio: 'Curadoria de coberturas, apartamentos amplos e imóveis de alto padrão no eixo Faria Lima.',
    href: '/corretores?corretor=juliana-mendes',
  },
  {
    id: 'renato-alves',
    name: 'Renato Alves',
    creci: 'CRECI 337120-F',
    avatar:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=160&q=80',
    region: 'Alto da Boa Vista, São Paulo',
    specialties: ['Compra', 'Aluguel'],
    activeListings: 27,
    responseTime: '25 min',
    rating: 4.7,
    dealsClosed: 83,
    bio: 'Atendimento para casas, imóveis familiares e negociações com perfil residencial de longo prazo.',
    href: '/corretores?corretor=renato-alves',
  },
  {
    id: 'camila-rocha',
    name: 'Camila Rocha',
    creci: 'CRECI 184320-F',
    avatar:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=80',
    region: 'Paulista, São Paulo',
    specialties: ['Comercial', 'Aluguel'],
    activeListings: 38,
    responseTime: '18 min',
    rating: 4.8,
    dealsClosed: 112,
    bio: 'Especialista em salas comerciais, escritórios prontos e operações corporativas enxutas.',
    href: '/corretores?corretor=camila-rocha',
  },
  {
    id: 'bianca-azevedo',
    name: 'Bianca Azevedo',
    creci: 'CRECI 289771-F',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80',
    region: 'Moema, São Paulo',
    specialties: ['Compra', 'Alto padrão'],
    activeListings: 46,
    responseTime: '12 min',
    rating: 4.9,
    dealsClosed: 141,
    bio: 'Consultoria para compra de apartamentos em Moema, Vila Nova Conceição e Campo Belo.',
    href: '/corretores?corretor=bianca-azevedo',
  },
]
