import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined'
import BedOutlinedIcon from '@mui/icons-material/BedOutlined'
import LocalParkingOutlinedIcon from '@mui/icons-material/LocalParkingOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined'
export const featuredProperties = [
  {
    href: '/imoveis/apartamento-jardins',
    image:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80',
    location: 'Jardins, São Paulo',
    title: 'Apartamento de alto padrão com vista livre',
    price: 'R$ 4.800 / mês',
    details: ['3 quartos', '2 banhos', '1 vaga', '95m²'],
    broker: 'Marina Costa',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
  },
  {
    href: '/imoveis/studio-vila-madalena',
    image:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80',
    location: 'Vila Madalena, São Paulo',
    title: 'Studio moderno totalmente reformado',
    price: 'R$ 2.900 / mês',
    details: ['1 quarto', '1 banho', '1 vaga', '42m²'],
    broker: 'Thiago Santos',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
  },
  {
    href: '/imoveis/cobertura-itaim-bibi',
    image:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80',
    location: 'Itaim Bibi, São Paulo',
    title: 'Cobertura tríplex com piscina privativa',
    price: 'R$ 12.500 / mês',
    details: ['4 quartos', '5 banhos', '3 vagas', '240m²'],
    broker: 'Juliana Mendes',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  },
  {
    href: '/imoveis/casa-alto-da-boa-vista',
    image:
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80',
    location: 'Alto da Boa Vista, São Paulo',
    title: 'Casa térrea com jardim privativo',
    price: 'R$ 7.200 / mês',
    details: ['3 quartos', '3 banhos', '2 vagas', '180m²'],
    broker: 'Renato Alves',
    avatar:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=120&q=80',
  },
  {
    href: '/imoveis/sala-comercial-paulista',
    image:
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
    location: 'Paulista, São Paulo',
    title: 'Sala comercial pronta para operação',
    price: 'R$ 6.600 / mês',
    details: ['4 salas', '2 banhos', '2 vagas', '110m²'],
    broker: 'Camila Rocha',
    avatar:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&q=80',
  },
  {
    href: '/imoveis/apartamento-moema',
    image:
      'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=900&q=80',
    location: 'Moema, São Paulo',
    title: 'Apartamento mobiliado perto do parque',
    price: 'R$ 5.400 / mês',
    details: ['2 quartos', '2 banhos', '1 vaga', '78m²'],
    broker: 'Bruna Lima',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
  },
]

export const miniProperties = [
  {
    title: 'Apartamento compacto',
    location: 'Pinheiros',
    image:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=520&q=75',
  },
  {
    title: 'Casa térrea',
    location: 'Moema',
    image:
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=520&q=75',
  },
  {
    title: 'Sala comercial',
    location: 'Itaim Bibi',
    image:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=520&q=75',
  },
  {
    title: 'Cobertura duplex',
    location: 'Jardins',
    image:
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=520&q=75',
  },
  {
    title: 'Studio mobiliado',
    location: 'Vila Madalena',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=520&q=75',
  },
  {
    title: 'Lote urbano',
    location: 'Alphaville',
    image:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=520&q=75',
  },
]

export const detailIcons = [
  BedOutlinedIcon,
  BathtubOutlinedIcon,
  LocalParkingOutlinedIcon,
  SquareFootOutlinedIcon,
]

export const searchOptions = {
  location: {
    label: 'Localização',
    query: 'localizacao',
    values: [
      'Jardins, São Paulo',
      'Vila Madalena, São Paulo',
      'Itaim Bibi, São Paulo',
      'Moema, São Paulo',
      'Pinheiros, São Paulo',
      'Savassi, Belo Horizonte',
      'Batista Campos, Belém',
    ],
  },
  propertyType: {
    label: 'Tipo de imóvel',
    query: 'tipo',
    values: [
      'Apartamento',
      'Casas residenciais',
      'Salas comerciais',
      'Terrenos e lotes',
      'Coberturas',
      'Chácaras e sítios',
      'Studios',
    ],
  },
  priceRange: {
    label: 'Faixa de preço',
    query: 'preco',
    values: [
      'Até R$ 2.500',
      'R$ 2.500 - R$ 6.000',
      'R$ 6.000 - R$ 10.000',
      'R$ 10.000 - R$ 18.000',
      'R$ 18.000 - R$ 35.000',
      'Acima de R$ 35.000',
    ],
  },
} as const

export type SearchFilterKey = keyof typeof searchOptions
export type TextSearchFilterKey = Exclude<SearchFilterKey, 'priceRange'>

export const searchFilterOrder: SearchFilterKey[] = ['location', 'propertyType', 'priceRange']
export const textSearchFilterOrder: TextSearchFilterKey[] = ['location', 'propertyType']

export const priceLimit = {
  min: 0,
  max: 10000,
  step: 500,
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)

export const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export const userProfile = {
  name: 'Rafael Martins',
  role: 'Corretor parceiro',
  company: 'Ketris Prime',
  email: 'rafael@ketris.com.br',
  avatar:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
}

export const profileActions = [
  { label: 'Suporte', icon: SupportAgentOutlinedIcon, href: '/login' },
  { label: 'Configurações', icon: SettingsOutlinedIcon, href: '/login' },
  { label: 'Trocar modalidade', icon: SwapHorizOutlinedIcon, href: '/imoveis' },
  { label: 'Sair', icon: LogoutOutlinedIcon, href: '/login', tone: 'danger' },
]

export const footerColumns = [
  {
    title: 'Para você',
    links: ['Buscar imóveis', 'Favoritos', 'Simulador financeiro'],
  },
  {
    title: 'Corretores',
    links: ['Quero anunciar', 'Portal parceiro', 'Soluções corporativas'],
  },
  {
    title: 'Empresa',
    links: ['Sobre nós', 'Contato', 'Trabalhe conosco'],
  },
]
