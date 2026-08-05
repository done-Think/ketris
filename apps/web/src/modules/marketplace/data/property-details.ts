import type { PropertyCardData } from '@shared/types'

export type MarketplacePropertyDetail = PropertyCardData & {
  id: string
  category: string
  condominium: string
  gallery: string[]
  description: string
  address: string
  mapCenter: {
    latitude: number
    longitude: number
  }
  brokerPhone: string
  brokerEmail: string
}

const apartmentGallery = [
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
]

export const propertyDetails: MarketplacePropertyDetail[] = [
  {
    id: 'apartamento-jardins',
    href: '/imoveis/apartamento-jardins',
    image: apartmentGallery[0],
    gallery: apartmentGallery,
    location: 'Jardins, São Paulo',
    title: 'Apartamento espaçoso com vista para o parque',
    category: 'Apartamento',
    condominium: 'Edifício Vista Parque',
    price: 'R$ 4.800 / mês',
    details: [
      { key: 'bedrooms', label: '3 quartos' },
      { key: 'bathrooms', label: '2 banheiros' },
      { key: 'parking', label: '1 vaga' },
      { key: 'area', label: '95m²' },
    ],
    description:
      'Excelente imóvel reformado com acabamento de alto padrão, living amplo integrado à varanda e vista definitiva para a copa das árvores. Suíte master com closet, espaços bem iluminados e planta eficiente para quem busca conforto e praticidade nos Jardins.',
    address: 'Jardins, São Paulo',
    mapCenter: { latitude: -23.5617, longitude: -46.6559 },
    broker: 'Marina Costa',
    brokerPhone: '(11) 99822-1104',
    brokerEmail: 'marina@ketris.com.br',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'studio-vila-madalena',
    href: '/imoveis/studio-vila-madalena',
    image:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=82',
    gallery: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
    ],
    location: 'Vila Madalena, São Paulo',
    title: 'Studio moderno totalmente reformado',
    category: 'Studio',
    condominium: 'Hub Vila Madalena',
    price: 'R$ 2.900 / mês',
    details: [
      { key: 'bedrooms', label: '1 quarto' },
      { key: 'bathrooms', label: '1 banheiro' },
      { key: 'parking', label: '1 vaga' },
      { key: 'area', label: '42m²' },
    ],
    description:
      'Studio mobiliado, com marcenaria planejada, cozinha integrada e ótima entrada de luz natural. Localização próxima a restaurantes, metrô e serviços essenciais.',
    address: 'Vila Madalena, São Paulo',
    mapCenter: { latitude: -23.5505, longitude: -46.6907 },
    broker: 'Thiago Santos',
    brokerPhone: '(11) 99740-2218',
    brokerEmail: 'thiago@ketris.com.br',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'cobertura-itaim-bibi',
    href: '/imoveis/cobertura-itaim-bibi',
    image:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=82',
    gallery: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
    ],
    location: 'Itaim Bibi, São Paulo',
    title: 'Cobertura tríplex com piscina privativa',
    category: 'Cobertura',
    condominium: 'Itaim Skyline',
    price: 'R$ 12.500 / mês',
    details: [
      { key: 'bedrooms', label: '4 quartos' },
      { key: 'bathrooms', label: '5 banheiros' },
      { key: 'parking', label: '3 vagas' },
      { key: 'area', label: '240m²' },
    ],
    description:
      'Cobertura tríplex com área externa privativa, piscina, espaço gourmet e vista aberta. Planta generosa para receber com conforto em uma das regiões mais desejadas da cidade.',
    address: 'Itaim Bibi, São Paulo',
    mapCenter: { latitude: -23.5847, longitude: -46.6783 },
    broker: 'Juliana Mendes',
    brokerPhone: '(11) 99140-3380',
    brokerEmail: 'juliana@ketris.com.br',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'apartamento-garden-remodelado',
    href: '/imoveis/apartamento-garden-remodelado',
    image:
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=900&q=80',
    gallery: apartmentGallery,
    location: 'Jardins, São Paulo',
    title: 'Apartamento Garden Remodelado',
    category: 'Apartamento',
    condominium: 'Garden Paulista',
    price: 'R$ 6.200 / mês',
    details: [
      { key: 'bedrooms', label: '2 quartos' },
      { key: 'bathrooms', label: '2 banheiros' },
      { key: 'parking', label: '1 vaga' },
      { key: 'area', label: '110m²' },
    ],
    description:
      'Apartamento garden com área externa privativa, ambientes integrados e reforma recente. Uma opção equilibrada para quem quer morar perto de serviços, restaurantes e áreas verdes.',
    address: 'Jardins, São Paulo',
    mapCenter: { latitude: -23.5686, longitude: -46.6625 },
    broker: 'Ana Silva',
    brokerPhone: '(11) 99822-1104',
    brokerEmail: 'ana@ketris.com.br',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'loft-industrial-mobiliado',
    href: '/imoveis/loft-industrial-mobiliado',
    image:
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=900&q=80',
    gallery: apartmentGallery,
    location: 'Jardins, São Paulo',
    title: 'Loft Industrial Finamente Mobiliado',
    category: 'Loft',
    condominium: 'Loft Jardins',
    price: 'R$ 5.500 / mês',
    details: [
      { key: 'bedrooms', label: '1 quarto' },
      { key: 'bathrooms', label: '1 banheiro' },
      { key: 'parking', label: '1 vaga' },
      { key: 'area', label: '78m²' },
    ],
    description:
      'Loft com pé-direito generoso, mobiliário sob medida e linguagem industrial elegante. Ideal para quem procura uma planta aberta e pronta para morar.',
    address: 'Jardins, São Paulo',
    mapCenter: { latitude: -23.5632, longitude: -46.6712 },
    broker: 'Carlos Souza',
    brokerPhone: '(11) 99740-2218',
    brokerEmail: 'carlos@ketris.com.br',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'casa-alto-da-boa-vista',
    href: '/imoveis/casa-alto-da-boa-vista',
    image:
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80',
    gallery: apartmentGallery,
    location: 'Alto da Boa Vista, São Paulo',
    title: 'Casa térrea com jardim privativo',
    category: 'Casa',
    condominium: 'Residencial Boa Vista',
    price: 'R$ 7.200 / mês',
    details: [
      { key: 'bedrooms', label: '3 quartos' },
      { key: 'bathrooms', label: '3 banheiros' },
      { key: 'parking', label: '2 vagas' },
      { key: 'area', label: '180m²' },
    ],
    description:
      'Casa térrea com jardim privativo, área social integrada e excelente distribuição dos ambientes. Boa opção para famílias que buscam conforto e privacidade.',
    address: 'Alto da Boa Vista, São Paulo',
    mapCenter: { latitude: -23.6346, longitude: -46.6993 },
    broker: 'Renato Alves',
    brokerPhone: '(11) 99480-5502',
    brokerEmail: 'renato@ketris.com.br',
    avatar:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'sala-comercial-paulista',
    href: '/imoveis/sala-comercial-paulista',
    image:
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
    gallery: apartmentGallery,
    location: 'Paulista, São Paulo',
    title: 'Sala comercial pronta para operação',
    category: 'Comercial',
    condominium: 'Paulista Corporate',
    price: 'R$ 6.600 / mês',
    details: [
      { key: 'bedrooms', label: '4 salas' },
      { key: 'bathrooms', label: '2 banheiros' },
      { key: 'parking', label: '2 vagas' },
      { key: 'area', label: '110m²' },
    ],
    description:
      'Conjunto comercial pronto para operação, com recepção, salas privativas e infraestrutura para equipes enxutas em endereço estratégico.',
    address: 'Paulista, São Paulo',
    mapCenter: { latitude: -23.563, longitude: -46.6543 },
    broker: 'Camila Rocha',
    brokerPhone: '(11) 99310-4410',
    brokerEmail: 'camila@ketris.com.br',
    avatar:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'apartamento-moema',
    href: '/imoveis/apartamento-moema',
    image:
      'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=900&q=80',
    gallery: apartmentGallery,
    location: 'Moema, São Paulo',
    title: 'Apartamento mobiliado perto do parque',
    category: 'Apartamento',
    condominium: 'Moema Park',
    price: 'R$ 5.400 / mês',
    details: [
      { key: 'bedrooms', label: '2 quartos' },
      { key: 'bathrooms', label: '2 banheiros' },
      { key: 'parking', label: '1 vaga' },
      { key: 'area', label: '78m²' },
    ],
    description:
      'Apartamento mobiliado próximo ao parque, com ambientes claros, cozinha equipada e excelente acesso a serviços do bairro.',
    address: 'Moema, São Paulo',
    mapCenter: { latitude: -23.6032, longitude: -46.6654 },
    broker: 'Bruna Lima',
    brokerPhone: '(11) 99611-8230',
    brokerEmail: 'bruna@ketris.com.br',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'apartamento-jardins-venda',
    href: '/imoveis/apartamento-jardins-venda',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=82',
    gallery: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=700&q=80',
    ],
    location: 'Jardins, São Paulo',
    title: 'Apartamento pronto para morar perto da Oscar Freire',
    category: 'Apartamento',
    condominium: 'Maison Jardins',
    price: 'R$ 1.420.000',
    details: [
      { key: 'bedrooms', label: '3 quartos' },
      { key: 'bathrooms', label: '3 banheiros' },
      { key: 'parking', label: '2 vagas' },
      { key: 'area', label: '118m²' },
    ],
    description:
      'Apartamento reformado para venda, com marcenaria planejada, varanda integrada e planta bem distribuída em endereço valorizado dos Jardins.',
    address: 'Jardins, São Paulo',
    mapCenter: { latitude: -23.5638, longitude: -46.6675 },
    broker: 'Laura Martins',
    brokerPhone: '(11) 99220-1840',
    brokerEmail: 'laura@ketris.com.br',
    avatar:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'apartamento-jardim-paulista-venda',
    href: '/imoveis/apartamento-jardim-paulista-venda',
    image:
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=82',
    gallery: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
    ],
    location: 'Jardins, São Paulo',
    title: 'Apartamento ensolarado no Jardim Paulista',
    category: 'Apartamento',
    condominium: 'Edifício Alameda',
    price: 'R$ 1.180.000',
    details: [
      { key: 'bedrooms', label: '2 quartos' },
      { key: 'bathrooms', label: '2 banheiros' },
      { key: 'parking', label: '1 vaga' },
      { key: 'area', label: '92m²' },
    ],
    description:
      'Unidade clara e silenciosa, com sala ampla, cozinha funcional e ótimo potencial de personalização em uma das alamedas mais procuradas da região.',
    address: 'Jardins, São Paulo',
    mapCenter: { latitude: -23.5691, longitude: -46.6598 },
    broker: 'Patrícia Nogueira',
    brokerPhone: '(11) 99182-7740',
    brokerEmail: 'patricia@ketris.com.br',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'cobertura-pinheiros-venda',
    href: '/imoveis/cobertura-pinheiros-venda',
    image:
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=82',
    gallery: [
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=700&q=80',
    ],
    location: 'Pinheiros, São Paulo',
    title: 'Cobertura duplex com área gourmet',
    category: 'Cobertura',
    condominium: 'Pinheiros View',
    price: 'R$ 2.350.000',
    details: [
      { key: 'bedrooms', label: '3 quartos' },
      { key: 'bathrooms', label: '4 banheiros' },
      { key: 'parking', label: '3 vagas' },
      { key: 'area', label: '186m²' },
    ],
    description:
      'Cobertura duplex à venda com terraço gourmet, suíte master reservada e vista aberta para a zona oeste.',
    address: 'Pinheiros, São Paulo',
    mapCenter: { latitude: -23.5662, longitude: -46.6842 },
    broker: 'Roberto Lima',
    brokerPhone: '(11) 99642-3018',
    brokerEmail: 'roberto@ketris.com.br',
    avatar:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'casa-alto-da-lapa-venda',
    href: '/imoveis/casa-alto-da-lapa-venda',
    image:
      'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1200&q=82',
    gallery: [
      'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
    ],
    location: 'Alto da Lapa, São Paulo',
    title: 'Casa com quintal e escritório independente',
    category: 'Casa',
    condominium: 'Rua tranquila',
    price: 'R$ 1.980.000',
    details: [
      { key: 'bedrooms', label: '4 quartos' },
      { key: 'bathrooms', label: '4 banheiros' },
      { key: 'parking', label: '3 vagas' },
      { key: 'area', label: '260m²' },
    ],
    description:
      'Casa térrea com ambientes integrados, quintal arborizado e edícula preparada para escritório, ideal para famílias que procuram espaço sem sair da cidade.',
    address: 'Alto da Lapa, São Paulo',
    mapCenter: { latitude: -23.5326, longitude: -46.7121 },
    broker: 'Fernando Barros',
    brokerPhone: '(11) 99580-4401',
    brokerEmail: 'fernando@ketris.com.br',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'loft-vila-madalena-venda',
    href: '/imoveis/loft-vila-madalena-venda',
    image:
      'https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1200&q=82',
    gallery: [
      'https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1200&q=82',
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80',
    ],
    location: 'Vila Madalena, São Paulo',
    title: 'Loft autoral em prédio boutique',
    category: 'Loft',
    condominium: 'Atelier Vila',
    price: 'R$ 890.000',
    details: [
      { key: 'bedrooms', label: '1 quarto' },
      { key: 'bathrooms', label: '1 banheiro' },
      { key: 'parking', label: '1 vaga' },
      { key: 'area', label: '68m²' },
    ],
    description:
      'Loft à venda com pé-direito alto, acabamentos contemporâneos e varanda voltada para uma rua calma da Vila Madalena.',
    address: 'Vila Madalena, São Paulo',
    mapCenter: { latitude: -23.5536, longitude: -46.6928 },
    broker: 'Bianca Azevedo',
    brokerPhone: '(11) 99414-7712',
    brokerEmail: 'bianca@ketris.com.br',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
  },
]

export function getPropertyDetailById(id: string) {
  return propertyDetails.find((property) => property.id === id)
}
