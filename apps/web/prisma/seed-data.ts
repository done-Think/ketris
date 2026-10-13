// Dados de demonstração usados por seed.ts para popular o banco local/dev com um cenário
// realista e navegável pela UI: várias imobiliárias, corretores autônomos, proprietários
// independentes, construtoras e locatários — o suficiente para testar papéis, permissões de
// acesso e vínculos entre tenants sem depender de dados criados manualmente ou por testes.

export type SeedRole = 'ADMIN' | 'OWNER' | 'AGENT' | 'RENTER'

export interface SeedTenantMember {
  name: string
  email: string
  role: SeedRole
  avatarUrl?: string
}

export interface SeedTenant {
  slug: string
  name: string
  corPrimaria?: string
  corSecundaria?: string
  members: SeedTenantMember[]
}

// Tenant "ketris-demo" preserva o slug original (é o tenant do admin@ketris.dev, usado o tempo
// todo em testes manuais) só renomeado para refletir que agora é uma imobiliária entre várias.
export const seedTenants: SeedTenant[] = [
  {
    slug: 'ketris-demo',
    name: 'Imobiliária Horizonte',
    corPrimaria: '#F30274',
    corSecundaria: '#212631',
    members: [
      {
        name: 'Imobiliária Horizonte',
        email: 'imobiliariahorizonte@ketris.com.br',
        role: 'ADMIN',
      },
      {
        name: 'Camila Rocha',
        email: 'camila@ketris.com.br',
        role: 'AGENT',
        avatarUrl:
          'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&q=80',
      },
      {
        name: 'Bruna Lima',
        email: 'bruna@ketris.com.br',
        role: 'AGENT',
        avatarUrl:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
      },
      {
        name: 'Marina Costa',
        email: 'marina@ketris.com.br',
        role: 'AGENT',
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      },
    ],
  },
  {
    slug: 'imobiliaria-vale-verde',
    name: 'Imobiliária Vale Verde',
    members: [
      {
        name: 'Thiago Santos',
        email: 'thiago@ketris.com.br',
        role: 'ADMIN',
        avatarUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      },
      {
        name: 'Laura Martins',
        email: 'laura@ketris.com.br',
        role: 'AGENT',
        avatarUrl:
          'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&q=80',
      },
      {
        name: 'Juliana Mendes',
        email: 'juliana@ketris.com.br',
        role: 'AGENT',
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      },
    ],
  },
  {
    slug: 'imobiliaria-boa-vista',
    name: 'Imobiliária Boa Vista',
    members: [
      {
        name: 'Bianca Azevedo',
        email: 'bianca@ketris.com.br',
        role: 'ADMIN',
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      },
      {
        name: 'Ana Silva',
        email: 'ana@ketris.com.br',
        role: 'AGENT',
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      },
      {
        name: 'Fernando Barros',
        email: 'fernando@ketris.com.br',
        role: 'AGENT',
        avatarUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      },
    ],
  },
  {
    slug: 'corretor-autonomo-roberto-lima',
    name: 'Roberto Lima — Corretor Autônomo',
    members: [
      {
        name: 'Roberto Lima',
        email: 'roberto@ketris.com.br',
        role: 'ADMIN',
        avatarUrl:
          'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=120&q=80',
      },
    ],
  },
  {
    slug: 'corretor-autonomo-patricia-nogueira',
    name: 'Patrícia Nogueira — Corretora Autônoma',
    members: [
      {
        name: 'Patrícia Nogueira',
        email: 'patricia@ketris.com.br',
        role: 'ADMIN',
        avatarUrl:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
      },
    ],
  },
  {
    slug: 'corretor-autonomo-renato-alves',
    name: 'Renato Alves — Corretor Autônomo',
    members: [
      {
        name: 'Renato Alves',
        email: 'renato@ketris.com.br',
        role: 'ADMIN',
        avatarUrl:
          'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=120&q=80',
      },
    ],
  },
  {
    slug: 'corretor-autonomo-carlos-souza',
    name: 'Carlos Souza — Corretor Autônomo',
    members: [
      {
        name: 'Carlos Souza',
        email: 'carlos@ketris.com.br',
        role: 'ADMIN',
        avatarUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      },
    ],
  },
  {
    slug: 'proprietario-joao-mendes',
    name: 'João Ricardo Mendes',
    members: [
      { name: 'João Ricardo Mendes', email: 'joao.mendes@proprietario.ketris.dev', role: 'ADMIN' },
    ],
  },
  {
    slug: 'proprietario-fernanda-cavalcanti',
    name: 'Fernanda Cavalcanti',
    members: [
      {
        name: 'Fernanda Cavalcanti',
        email: 'fernanda.cavalcanti@proprietario.ketris.dev',
        role: 'ADMIN',
      },
    ],
  },
  {
    slug: 'construtora-pedra-azul',
    name: 'Construtora Pedra Azul',
    members: [
      { name: 'Construtora Pedra Azul', email: 'contato@pedraazul.ketris.dev', role: 'ADMIN' },
    ],
  },
  {
    slug: 'construtora-nova-aurora',
    name: 'Construtora Nova Aurora',
    members: [
      { name: 'Construtora Nova Aurora', email: 'contato@novaaurora.ketris.dev', role: 'ADMIN' },
    ],
  },
  {
    slug: 'locatarios',
    name: 'Locatários Ketris',
    members: [
      { name: 'Mariana Alves', email: 'mariana.alves@locatario.ketris.dev', role: 'RENTER' },
      { name: 'Pedro Henrique Souza', email: 'pedro.souza@locatario.ketris.dev', role: 'RENTER' },
    ],
  },
]

export interface SeedProperty {
  id: string
  title: string
  description: string
  category: string
  purpose: 'ALUGUEL' | 'VENDA'
  status?: 'DRAFT' | 'PUBLISHED' | 'RENTED' | 'SOLD' | 'INACTIVE'
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
  // E-mail do usuário responsável (responsavelId) — corretor, ou o próprio ADMIN quando o
  // responsável é um proprietário/construtora sem corretor dedicado.
  responsavelEmail: string
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
    responsavelEmail: 'marina@ketris.com.br',
  },
  {
    id: 'studio-vila-madalena',
    title: 'Studio moderno totalmente reformado',
    description:
      'Studio mobiliado, com marcenaria planejada, cozinha integrada e ótima entrada de luz natural. Localização próxima a restaurantes, metrô e serviços essenciais.',
    category: 'studio',
    purpose: 'ALUGUEL',
    status: 'RENTED',
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
    responsavelEmail: 'thiago@ketris.com.br',
  },
  {
    id: 'cobertura-itaim-bibi',
    title: 'Cobertura tríplex com piscina privativa',
    description:
      'Cobertura tríplex com área externa privativa, piscina, espaço gourmet e vista aberta. Planta generosa para receber com conforto em uma das regiões mais desejadas da cidade.',
    category: 'cobertura',
    purpose: 'ALUGUEL',
    status: 'DRAFT',
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
    responsavelEmail: 'juliana@ketris.com.br',
  },
  {
    id: 'apartamento-garden-remodelado',
    title: 'Apartamento Garden Remodelado',
    description:
      'Apartamento garden com área externa privativa, ambientes integrados e reforma recente. Uma opção equilibrada para quem quer morar perto de serviços, restaurantes e áreas verdes.',
    category: 'apartamento',
    purpose: 'ALUGUEL',
    status: 'INACTIVE',
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
    responsavelEmail: 'ana@ketris.com.br',
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
    responsavelEmail: 'carlos@ketris.com.br',
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
    responsavelEmail: 'renato@ketris.com.br',
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
    responsavelEmail: 'camila@ketris.com.br',
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
    responsavelEmail: 'bruna@ketris.com.br',
  },
  {
    id: 'apartamento-jardins-venda',
    title: 'Apartamento pronto para morar perto da Oscar Freire',
    description:
      'Apartamento reformado para venda, com marcenaria planejada, varanda integrada e planta bem distribuída em endereço valorizado dos Jardins.',
    category: 'apartamento',
    purpose: 'VENDA',
    status: 'SOLD',
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
    responsavelEmail: 'laura@ketris.com.br',
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
    responsavelEmail: 'patricia@ketris.com.br',
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
    responsavelEmail: 'roberto@ketris.com.br',
  },
  {
    id: 'casa-alto-da-lapa-venda',
    title: 'Casa com quintal e escritório independente',
    description:
      'Casa térrea com ambientes integrados, quintal arborizado e edícula preparada para escritório, ideal para famílias que procuram espaço sem sair da cidade.',
    category: 'casa',
    purpose: 'VENDA',
    status: 'DRAFT',
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
    responsavelEmail: 'fernando@ketris.com.br',
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
    responsavelEmail: 'bianca@ketris.com.br',
  },
  // Imóveis de proprietários independentes — sem corretor, o próprio ADMIN do tenant é o
  // responsável.
  {
    id: 'apartamento-vila-olimpia-proprietario',
    title: 'Apartamento com vista panorâmica na Vila Olímpia',
    description:
      'Apartamento de proprietário direto, sem intermediação de imobiliária, com vista panorâmica, varanda gourmet e infraestrutura completa de lazer no condomínio.',
    category: 'apartamento',
    purpose: 'ALUGUEL',
    price: 5800,
    bedrooms: 2,
    bathrooms: 2,
    parking: 2,
    areaM2: 88,
    neighborhood: 'Vila Olímpia',
    city: 'São Paulo',
    latitude: -23.5955,
    longitude: -46.6869,
    images: apartmentGallery,
    responsavelEmail: 'joao.mendes@proprietario.ketris.dev',
  },
  {
    id: 'casa-perdizes-proprietario',
    title: 'Casa térrea reformada em Perdizes',
    description:
      'Casa térrea de proprietário direto, recém-reformada, com quintal e garagem coberta, em rua tranquila e bem localizada de Perdizes.',
    category: 'casa',
    purpose: 'ALUGUEL',
    price: 6400,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    areaM2: 150,
    neighborhood: 'Perdizes',
    city: 'São Paulo',
    latitude: -23.5378,
    longitude: -46.6789,
    images: apartmentGallery,
    responsavelEmail: 'joao.mendes@proprietario.ketris.dev',
  },
  {
    id: 'studio-itaim-proprietario',
    title: 'Studio compacto no Itaim Bibi',
    description:
      'Studio de proprietário direto, ideal para quem busca praticidade, com armários planejados e localização estratégica no Itaim Bibi.',
    category: 'studio',
    purpose: 'ALUGUEL',
    price: 3200,
    bedrooms: 1,
    bathrooms: 1,
    parking: 1,
    areaM2: 38,
    neighborhood: 'Itaim Bibi',
    city: 'São Paulo',
    latitude: -23.5836,
    longitude: -46.6746,
    images: apartmentGallery,
    responsavelEmail: 'fernanda.cavalcanti@proprietario.ketris.dev',
  },
  {
    id: 'cobertura-moema-proprietario',
    title: 'Cobertura duplex em Moema',
    description:
      'Cobertura duplex de proprietário direto, com terraço amplo, churrasqueira e vista livre para o Parque Ibirapuera.',
    category: 'cobertura',
    purpose: 'VENDA',
    price: 1850000,
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    areaM2: 175,
    neighborhood: 'Moema',
    city: 'São Paulo',
    latitude: -23.6012,
    longitude: -46.6621,
    images: apartmentGallery,
    responsavelEmail: 'fernanda.cavalcanti@proprietario.ketris.dev',
  },
  // Unidades de lançamento das construtoras.
  {
    id: 'pedra-azul-unidade-501',
    title: 'Unidade 501 — Edifício Pedra Azul',
    description:
      'Unidade de lançamento no Edifício Pedra Azul, com planta otimizada, acabamento de entrega premium e vista aberta para a região.',
    category: 'apartamento',
    purpose: 'VENDA',
    price: 980000,
    bedrooms: 2,
    bathrooms: 2,
    parking: 2,
    areaM2: 82,
    neighborhood: 'Brooklin',
    city: 'São Paulo',
    latitude: -23.6157,
    longitude: -46.6947,
    images: apartmentGallery,
    responsavelEmail: 'contato@pedraazul.ketris.dev',
  },
  {
    id: 'pedra-azul-unidade-802',
    title: 'Unidade 802 — Edifício Pedra Azul',
    description:
      'Unidade de alto andar do Edifício Pedra Azul, com suíte master, varanda gourmet integrada e vista privilegiada.',
    category: 'apartamento',
    purpose: 'VENDA',
    price: 1120000,
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    areaM2: 98,
    neighborhood: 'Brooklin',
    city: 'São Paulo',
    latitude: -23.6157,
    longitude: -46.6947,
    images: apartmentGallery,
    responsavelEmail: 'contato@pedraazul.ketris.dev',
  },
  {
    id: 'pedra-azul-unidade-1203',
    title: 'Unidade 1203 — Edifício Pedra Azul',
    description:
      'Cobertura linear do Edifício Pedra Azul, ainda na planta, com terraço privativo e acabamento personalizável.',
    category: 'cobertura',
    purpose: 'VENDA',
    status: 'DRAFT',
    price: 1850000,
    bedrooms: 4,
    bathrooms: 4,
    parking: 3,
    areaM2: 165,
    neighborhood: 'Brooklin',
    city: 'São Paulo',
    latitude: -23.6157,
    longitude: -46.6947,
    images: apartmentGallery,
    responsavelEmail: 'contato@pedraazul.ketris.dev',
  },
  {
    id: 'nova-aurora-casa-12',
    title: 'Casa 12 — Condomínio Nova Aurora',
    description:
      'Casa em condomínio fechado de lançamento, com quintal privativo, área de lazer completa e segurança 24h.',
    category: 'casa',
    purpose: 'VENDA',
    price: 890000,
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    areaM2: 140,
    neighborhood: 'Granja Viana',
    city: 'Cotia',
    latitude: -23.6013,
    longitude: -46.8836,
    images: apartmentGallery,
    responsavelEmail: 'contato@novaaurora.ketris.dev',
  },
  {
    id: 'nova-aurora-casa-24',
    title: 'Casa 24 — Condomínio Nova Aurora',
    description:
      'Casa de esquina no Condomínio Nova Aurora, com quintal amplo, edícula e vaga dupla coberta.',
    category: 'casa',
    purpose: 'VENDA',
    price: 950000,
    bedrooms: 4,
    bathrooms: 3,
    parking: 2,
    areaM2: 160,
    neighborhood: 'Granja Viana',
    city: 'Cotia',
    latitude: -23.6013,
    longitude: -46.8836,
    images: apartmentGallery,
    responsavelEmail: 'contato@novaaurora.ketris.dev',
  },
  {
    id: 'nova-aurora-penthouse',
    title: 'Cobertura Penthouse — Nova Aurora',
    description:
      'Unidade penthouse do Condomínio Nova Aurora, com terraço panorâmico, piscina privativa e acabamento premium de entrega.',
    category: 'cobertura',
    purpose: 'VENDA',
    price: 1650000,
    bedrooms: 4,
    bathrooms: 5,
    parking: 3,
    areaM2: 220,
    neighborhood: 'Granja Viana',
    city: 'Cotia',
    latitude: -23.6013,
    longitude: -46.8836,
    images: apartmentGallery,
    responsavelEmail: 'contato@novaaurora.ketris.dev',
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
// Continuam ligados à Imobiliária Horizonte (antiga "Ketris Demo").
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
// Restritas aos 3 imóveis que continuam na Imobiliária Horizonte (antiga "Ketris Demo") — um
// imóvel pode ter mais de uma oportunidade, o que aqui é usado só para cobrir todos os status
// sem precisar de imóveis de outros tenants (a oportunidade tem que ficar no mesmo tenant do
// imóvel referenciado).
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
    id: 'seed-op-jardins-leticia',
    propertyId: 'apartamento-jardins',
    contactId: 'leticia-ramos',
    leadName: 'Letícia Ramos',
    leadEmail: 'leticia_ramos@outlook.com',
    proposedValue: 4700,
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
    id: 'seed-op-moema-marcelo',
    propertyId: 'apartamento-moema',
    contactId: null,
    leadName: 'Marcelo Tavares',
    leadEmail: 'marcelo.tavares@example.com',
    proposedValue: 5300,
    status: 'ACEITA',
  },
  {
    id: 'seed-op-sala-paulista-heitor',
    propertyId: 'sala-comercial-paulista',
    contactId: 'heitor-prado',
    leadName: 'Heitor Prado',
    leadEmail: 'heitor.prado@ketrisrealty.com',
    proposedValue: 6600,
    status: 'ENVIADA',
  },
  {
    id: 'seed-op-sala-paulista-diego',
    propertyId: 'sala-comercial-paulista',
    contactId: null,
    leadName: 'Diego Fontes',
    leadEmail: 'diego.fontes@example.com',
    proposedValue: 6300,
    status: 'RECUSADA',
  },
]
