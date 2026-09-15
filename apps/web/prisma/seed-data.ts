// Dados de demonstração derivados dos mocks de front-end (marketplace e crm), usados por seed.ts
// para popular o banco local/dev com um cenário realista e navegável pela UI.

export interface SeedPropertyBroker {
  name: string
  email: string
  avatarUrl: string
}

export interface SeedProperty {
  id: string
  title: string
  description: string
  category: string
  purpose: 'ALUGUEL' | 'VENDA'
  price: number
  bedrooms: number
  bathrooms: number
  parking: number
  areaM2: number
  neighborhood: string
  city: string
  latitude: number
  longitude: number
  images: string[]
  broker: SeedPropertyBroker
}

const apartmentGallery = [
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
]

// Derivado de src/modules/marketplace/data/property-details.ts (mesmos ids, textos e imagens).
export const seedProperties: SeedProperty[] = [
  {
    id: 'apartamento-jardins',
    title: 'Apartamento espaçoso com vista para o parque',
    description:
      'Excelente imóvel reformado com acabamento de alto padrão, living amplo integrado à varanda e vista definitiva para a copa das árvores. Suíte master com closet, espaços bem iluminados e planta eficiente para quem busca conforto e praticidade nos Jardins.',
    category: 'apartamento',
    purpose: 'ALUGUEL',
    price: 4800,
    bedrooms: 3,
    bathrooms: 2,
    parking: 1,
    areaM2: 95,
    neighborhood: 'Jardins',
    city: 'São Paulo',
    latitude: -23.5617,
    longitude: -46.6559,
    images: apartmentGallery,
    broker: {
      name: 'Marina Costa',
      email: 'marina@ketris.com.br',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    },
  },
  {
    id: 'studio-vila-madalena',
    title: 'Studio moderno totalmente reformado',
    description:
      'Studio mobiliado, com marcenaria planejada, cozinha integrada e ótima entrada de luz natural. Localização próxima a restaurantes, metrô e serviços essenciais.',
    category: 'studio',
    purpose: 'ALUGUEL',
    price: 2900,
    bedrooms: 1,
    bathrooms: 1,
    parking: 1,
    areaM2: 42,
    neighborhood: 'Vila Madalena',
    city: 'São Paulo',
    latitude: -23.5505,
    longitude: -46.6907,
    images: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
    ],
    broker: {
      name: 'Thiago Santos',
      email: 'thiago@ketris.com.br',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    },
  },
  {
    id: 'cobertura-itaim-bibi',
    title: 'Cobertura tríplex com piscina privativa',
    description:
      'Cobertura tríplex com área externa privativa, piscina, espaço gourmet e vista aberta. Planta generosa para receber com conforto em uma das regiões mais desejadas da cidade.',
    category: 'cobertura',
    purpose: 'ALUGUEL',
    price: 12500,
    bedrooms: 4,
    bathrooms: 5,
    parking: 3,
    areaM2: 240,
    neighborhood: 'Itaim Bibi',
    city: 'São Paulo',
    latitude: -23.5847,
    longitude: -46.6783,
    images: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
    ],
    broker: {
      name: 'Juliana Mendes',
      email: 'juliana@ketris.com.br',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    },
  },
  {
    id: 'apartamento-garden-remodelado',
    title: 'Apartamento Garden Remodelado',
    description:
      'Apartamento garden com área externa privativa, ambientes integrados e reforma recente. Uma opção equilibrada para quem quer morar perto de serviços, restaurantes e áreas verdes.',
    category: 'apartamento',
    purpose: 'ALUGUEL',
    price: 6200,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    areaM2: 110,
    neighborhood: 'Jardins',
    city: 'São Paulo',
    latitude: -23.5686,
    longitude: -46.6625,
    images: apartmentGallery,
    broker: {
      name: 'Ana Silva',
      email: 'ana@ketris.com.br',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    },
  },
  {
    id: 'loft-industrial-mobiliado',
    title: 'Loft Industrial Finamente Mobiliado',
    description:
      'Loft com pé-direito generoso, mobiliário sob medida e linguagem industrial elegante. Ideal para quem procura uma planta aberta e pronta para morar.',
    category: 'loft',
    purpose: 'ALUGUEL',
    price: 5500,
    bedrooms: 1,
    bathrooms: 1,
    parking: 1,
    areaM2: 78,
    neighborhood: 'Jardins',
    city: 'São Paulo',
    latitude: -23.5632,
    longitude: -46.6712,
    images: apartmentGallery,
    broker: {
      name: 'Carlos Souza',
      email: 'carlos@ketris.com.br',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    },
  },
  {
    id: 'casa-alto-da-boa-vista',
    title: 'Casa térrea com jardim privativo',
    description:
      'Casa térrea com jardim privativo, área social integrada e excelente distribuição dos ambientes. Boa opção para famílias que buscam conforto e privacidade.',
    category: 'casa',
    purpose: 'ALUGUEL',
    price: 7200,
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    areaM2: 180,
    neighborhood: 'Alto da Boa Vista',
    city: 'São Paulo',
    latitude: -23.6346,
    longitude: -46.6993,
    images: apartmentGallery,
    broker: {
      name: 'Renato Alves',
      email: 'renato@ketris.com.br',
      avatarUrl:
        'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=120&q=80',
    },
  },
  {
    id: 'sala-comercial-paulista',
    title: 'Sala comercial pronta para operação',
    description:
      'Conjunto comercial pronto para operação, com recepção, salas privativas e infraestrutura para equipes enxutas em endereço estratégico.',
    category: 'comercial',
    purpose: 'ALUGUEL',
    price: 6600,
    bedrooms: 4,
    bathrooms: 2,
    parking: 2,
    areaM2: 110,
    neighborhood: 'Paulista',
    city: 'São Paulo',
    latitude: -23.563,
    longitude: -46.6543,
    images: apartmentGallery,
    broker: {
      name: 'Camila Rocha',
      email: 'camila@ketris.com.br',
      avatarUrl:
        'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&q=80',
    },
  },
  {
    id: 'apartamento-moema',
    title: 'Apartamento mobiliado perto do parque',
    description:
      'Apartamento mobiliado próximo ao parque, com ambientes claros, cozinha equipada e excelente acesso a serviços do bairro.',
    category: 'apartamento',
    purpose: 'ALUGUEL',
    price: 5400,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    areaM2: 78,
    neighborhood: 'Moema',
    city: 'São Paulo',
    latitude: -23.6032,
    longitude: -46.6654,
    images: apartmentGallery,
    broker: {
      name: 'Bruna Lima',
      email: 'bruna@ketris.com.br',
      avatarUrl:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
    },
  },
  {
    id: 'apartamento-jardins-venda',
    title: 'Apartamento pronto para morar perto da Oscar Freire',
    description:
      'Apartamento reformado para venda, com marcenaria planejada, varanda integrada e planta bem distribuída em endereço valorizado dos Jardins.',
    category: 'apartamento',
    purpose: 'VENDA',
    price: 1420000,
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    areaM2: 118,
    neighborhood: 'Jardins',
    city: 'São Paulo',
    latitude: -23.5638,
    longitude: -46.6675,
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=700&q=80',
    ],
    broker: {
      name: 'Laura Martins',
      email: 'laura@ketris.com.br',
      avatarUrl:
        'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&q=80',
    },
  },
  {
    id: 'apartamento-jardim-paulista-venda',
    title: 'Apartamento ensolarado no Jardim Paulista',
    description:
      'Unidade clara e silenciosa, com sala ampla, cozinha funcional e ótimo potencial de personalização em uma das alamedas mais procuradas da região.',
    category: 'apartamento',
    purpose: 'VENDA',
    price: 1180000,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    areaM2: 92,
    neighborhood: 'Jardim Paulista',
    city: 'São Paulo',
    latitude: -23.5691,
    longitude: -46.6598,
    images: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
    ],
    broker: {
      name: 'Patrícia Nogueira',
      email: 'patricia@ketris.com.br',
      avatarUrl:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
    },
  },
  {
    id: 'cobertura-pinheiros-venda',
    title: 'Cobertura duplex com área gourmet',
    description:
      'Cobertura duplex à venda com terraço gourmet, suíte master reservada e vista aberta para a zona oeste.',
    category: 'cobertura',
    purpose: 'VENDA',
    price: 2350000,
    bedrooms: 3,
    bathrooms: 4,
    parking: 3,
    areaM2: 186,
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    latitude: -23.5662,
    longitude: -46.6842,
    images: [
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=700&q=80',
    ],
    broker: {
      name: 'Roberto Lima',
      email: 'roberto@ketris.com.br',
      avatarUrl:
        'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=120&q=80',
    },
  },
  {
    id: 'casa-alto-da-lapa-venda',
    title: 'Casa com quintal e escritório independente',
    description:
      'Casa térrea com ambientes integrados, quintal arborizado e edícula preparada para escritório, ideal para famílias que procuram espaço sem sair da cidade.',
    category: 'casa',
    purpose: 'VENDA',
    price: 1980000,
    bedrooms: 4,
    bathrooms: 4,
    parking: 3,
    areaM2: 260,
    neighborhood: 'Alto da Lapa',
    city: 'São Paulo',
    latitude: -23.5326,
    longitude: -46.7121,
    images: [
      'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
    ],
    broker: {
      name: 'Fernando Barros',
      email: 'fernando@ketris.com.br',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    },
  },
  {
    id: 'loft-vila-madalena-venda',
    title: 'Loft autoral em prédio boutique',
    description:
      'Loft à venda com pé-direito alto, acabamentos contemporâneos e varanda voltada para uma rua calma da Vila Madalena.',
    category: 'loft',
    purpose: 'VENDA',
    price: 890000,
    bedrooms: 1,
    bathrooms: 1,
    parking: 1,
    areaM2: 68,
    neighborhood: 'Vila Madalena',
    city: 'São Paulo',
    latitude: -23.5536,
    longitude: -46.6928,
    images: [
      'https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
    ],
    broker: {
      name: 'Bianca Azevedo',
      email: 'bianca@ketris.com.br',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    },
  },
]

export interface SeedContact {
  id: string
  name: string
  type: 'PROPRIETARIO' | 'LOCATARIO' | 'CORRETOR'
  phone: string
  email: string
  avatarUrl: string
  hoursSinceLastInteraction: number
}

// Derivado de src/modules/crm/fixtures/contact-list-fixtures.ts (mesmos ids, nomes e contatos).
export const seedContacts: SeedContact[] = [
  {
    id: 'ricardo-mendes',
    name: 'Ricardo Mendes',
    type: 'LOCATARIO',
    phone: '(11) 98722-1200',
    email: 'ricardo.mendes@email.com',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
    hoursSinceLastInteraction: 2,
  },
  {
    id: 'sandra-vasconcellos',
    name: 'Sandra Vasconcellos',
    type: 'PROPRIETARIO',
    phone: '(11) 99100-4491',
    email: 'sandra.vasc@corpprop.br',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
    hoursSinceLastInteraction: 24,
  },
  {
    id: 'heitor-prado',
    name: 'Heitor Prado',
    type: 'CORRETOR',
    phone: '(11) 98112-9900',
    email: 'heitor.prado@ketrisrealty.com',
    avatarUrl:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=80&q=80',
    hoursSinceLastInteraction: 3,
  },
  {
    id: 'leticia-ramos',
    name: 'Letícia Ramos',
    type: 'LOCATARIO',
    phone: '(11) 97711-2004',
    email: 'leticia_ramos@outlook.com',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
    hoursSinceLastInteraction: 72,
  },
  {
    id: 'carlos-eduardo',
    name: 'Carlos Eduardo',
    type: 'LOCATARIO',
    phone: '(11) 98221-1250',
    email: 'carlos.edu@tecblue.com',
    avatarUrl:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=80&q=80',
    hoursSinceLastInteraction: 24,
  },
  {
    id: 'ana-beatriz-ramos',
    name: 'Ana Beatriz Ramos',
    type: 'PROPRIETARIO',
    phone: '(11) 99882-1011',
    email: 'anabeatriz@grupojardins.com',
    avatarUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=80&q=80',
    hoursSinceLastInteraction: 120,
  },
]

export interface SeedOpportunity {
  id: string
  propertyId: string
  contactId: string | null
  leadName: string
  leadEmail: string
  proposedValue: number
  status: 'RASCUNHO' | 'ENVIADA' | 'EM_NEGOCIACAO' | 'ACEITA' | 'RECUSADA'
}

// Liga contatos e imóveis já semeados acima, cobrindo os cinco status do pipeline do crm.
export const seedOpportunities: SeedOpportunity[] = [
  {
    id: 'seed-op-jardins-ricardo',
    propertyId: 'apartamento-jardins',
    contactId: 'ricardo-mendes',
    leadName: 'Ricardo Mendes',
    leadEmail: 'ricardo.mendes@email.com',
    proposedValue: 4800,
    status: 'ENVIADA',
  },
  {
    id: 'seed-op-vila-madalena-leticia',
    propertyId: 'studio-vila-madalena',
    contactId: 'leticia-ramos',
    leadName: 'Letícia Ramos',
    leadEmail: 'leticia_ramos@outlook.com',
    proposedValue: 2900,
    status: 'RASCUNHO',
  },
  {
    id: 'seed-op-moema-carlos',
    propertyId: 'apartamento-moema',
    contactId: 'carlos-eduardo',
    leadName: 'Carlos Eduardo',
    leadEmail: 'carlos.edu@tecblue.com',
    proposedValue: 5200,
    status: 'EM_NEGOCIACAO',
  },
  {
    id: 'seed-op-itaim-fernanda',
    propertyId: 'cobertura-itaim-bibi',
    contactId: null,
    leadName: 'Fernanda Costa',
    leadEmail: 'fernanda.costa@example.com',
    proposedValue: 12500,
    status: 'ENVIADA',
  },
  {
    id: 'seed-op-boa-vista-marcelo',
    propertyId: 'casa-alto-da-boa-vista',
    contactId: null,
    leadName: 'Marcelo Tavares',
    leadEmail: 'marcelo.tavares@example.com',
    proposedValue: 7000,
    status: 'ACEITA',
  },
  {
    id: 'seed-op-jardins-venda-renata',
    propertyId: 'apartamento-jardins-venda',
    contactId: null,
    leadName: 'Renata Alencar',
    leadEmail: 'renata.alencar@example.com',
    proposedValue: 1400000,
    status: 'EM_NEGOCIACAO',
  },
  {
    id: 'seed-op-pinheiros-diego',
    propertyId: 'cobertura-pinheiros-venda',
    contactId: null,
    leadName: 'Diego Fontes',
    leadEmail: 'diego.fontes@example.com',
    proposedValue: 2300000,
    status: 'RECUSADA',
  },
  {
    id: 'seed-op-vila-madalena-venda-heitor',
    propertyId: 'loft-vila-madalena-venda',
    contactId: 'heitor-prado',
    leadName: 'Heitor Prado',
    leadEmail: 'heitor.prado@ketrisrealty.com',
    proposedValue: 880000,
    status: 'ENVIADA',
  },
]
