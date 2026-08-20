import type { DashboardProperty, DashboardPropertyFilterKey } from '../types/dashboard-property'

export const propertyStatusFilters: Array<{ label: DashboardPropertyFilterKey }> = [
  { label: 'Todos' },
  { label: 'Disponível' },
  { label: 'Alugado' },
  { label: 'Vendido' },
  { label: 'Em análise' },
  { label: 'Inativo' },
]

const apartmentMedia = [
  {
    url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=82',
    label: 'Sala integrada',
    kind: 'Foto',
  },
  {
    url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=900&q=82',
    label: 'Cozinha planejada',
    kind: 'Foto',
  },
  {
    url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=82',
    label: 'Suíte principal',
    kind: 'Foto',
  },
] as const

export const dashboardProperties: DashboardProperty[] = [
  {
    id: 'apt-jardins-3q',
    title: 'Apt Jardins 3q',
    address: 'Alameda Lorena, 1420',
    location: 'Jardins, São Paulo',
    type: 'Apartamento',
    purpose: 'Aluguel',
    price: 'R$ 6.500/mês',
    status: 'Disponível',
    broker: 'Roberto Souza',
    updatedAt: 'Há 2 horas',
    imageUrl:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=160&q=80',
    heroImageUrl:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1280&q=84',
    media: [...apartmentMedia, { ...apartmentMedia[0], label: 'Planta baixa', kind: 'Planta' }],
    summary: {
      bedrooms: '3',
      bathrooms: '2',
      parkingSpaces: '2',
      area: '95m²',
      condominium: 'R$ 1.200',
      iptu: 'R$ 380/mês',
    },
    pricing: {
      rent: 'R$ 6.500/mês',
      sale: 'Não anunciado',
      condominium: 'R$ 1.200',
      iptu: 'R$ 380/mês',
      administrationFee: '8% sobre aluguel',
      securityDeposit: '3 aluguéis',
      lastAdjustment: 'R$ 300 há 5 dias',
    },
    participants: [
      {
        name: 'Carlos Eduardo',
        role: 'Proprietário',
        initials: 'CE',
        imageUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80',
      },
      {
        name: 'Roberto Souza',
        role: 'Corretor',
        initials: 'RS',
        imageUrl:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&q=80',
      },
      { name: 'Lopes Jardins', role: 'Imobiliária', initials: 'LJ' },
    ],
    activityHistory: [
      { label: 'Status alterado para Disponível', date: 'há 2 horas', tone: 'success' },
      { label: 'Fotos atualizadas', date: 'há 1 dia', tone: 'accent' },
      { label: 'Visita agendada com João Silva', date: 'há 3 dias', tone: 'info' },
      { label: 'Ajuste de preço para R$ 6.500', date: 'há 5 dias', tone: 'warning' },
      { label: 'Cadastro do imóvel efetuado', date: 'há 1 semana', tone: 'neutral' },
    ],
  },
  {
    id: 'studio-pinheiros',
    title: 'Studio Pinheiros',
    address: 'Rua Teodoro Sampaio, 840',
    location: 'Pinheiros, São Paulo',
    type: 'Studio',
    purpose: 'Aluguel',
    price: 'R$ 3.200/mês',
    status: 'Alugado',
    broker: 'Ana Paula',
    updatedAt: 'Há 1 dia',
    imageUrl:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=160&q=80',
    heroImageUrl:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1280&q=84',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=82',
        label: 'Ambiente principal',
        kind: 'Foto',
      },
      {
        url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=82',
        label: 'Quarto mobiliado',
        kind: 'Foto',
      },
      { ...apartmentMedia[1], label: 'Tour em vídeo', kind: 'Vídeo' },
    ],
    summary: {
      bedrooms: '1',
      bathrooms: '1',
      parkingSpaces: '1',
      area: '42m²',
      condominium: 'R$ 680',
      iptu: 'R$ 180/mês',
    },
    pricing: {
      rent: 'R$ 3.200/mês',
      sale: 'Não anunciado',
      condominium: 'R$ 680',
      iptu: 'R$ 180/mês',
      administrationFee: '7% sobre aluguel',
      securityDeposit: 'Seguro fiança',
      lastAdjustment: 'Sem reajuste recente',
    },
    participants: [
      { name: 'Marina Costa', role: 'Proprietária', initials: 'MC' },
      { name: 'Ana Paula', role: 'Corretora', initials: 'AP' },
    ],
    activityHistory: [
      { label: 'Contrato marcado como alugado', date: 'há 1 dia', tone: 'info' },
      { label: 'Proposta aprovada', date: 'há 4 dias', tone: 'success' },
      { label: 'Cadastro do imóvel efetuado', date: 'há 2 semanas', tone: 'neutral' },
    ],
  },
  {
    id: 'cobertura-itaim',
    title: 'Cobertura Itaim',
    address: 'Rua Tabapuã, 1100',
    location: 'Itaim Bibi, São Paulo',
    type: 'Cobertura',
    purpose: 'Venda',
    price: 'R$ 4.500.000',
    status: 'Ativo',
    broker: 'Roberto Souza',
    updatedAt: 'Há 3 dias',
    imageUrl:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=160&q=80',
    heroImageUrl:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1280&q=84',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=82',
        label: 'Living social',
        kind: 'Foto',
      },
      {
        url: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=82',
        label: 'Área gourmet',
        kind: 'Foto',
      },
      { ...apartmentMedia[2], label: 'Planta duplex', kind: 'Planta' },
    ],
    summary: {
      bedrooms: '4',
      bathrooms: '5',
      parkingSpaces: '4',
      area: '240m²',
      condominium: 'R$ 3.900',
      iptu: 'R$ 1.450/mês',
    },
    pricing: {
      rent: 'Não anunciado',
      sale: 'R$ 4.500.000',
      condominium: 'R$ 3.900',
      iptu: 'R$ 1.450/mês',
      administrationFee: '2% na venda',
      securityDeposit: 'Não aplicável',
      lastAdjustment: 'Preço validado há 3 dias',
    },
    participants: [
      { name: 'Helena Prado', role: 'Proprietária', initials: 'HP' },
      { name: 'Roberto Souza', role: 'Corretor', initials: 'RS' },
    ],
    activityHistory: [
      { label: 'Imóvel ativado para venda', date: 'há 3 dias', tone: 'success' },
      { label: 'Fotos atualizadas', date: 'há 6 dias', tone: 'accent' },
      { label: 'Cadastro do imóvel efetuado', date: 'há 3 semanas', tone: 'neutral' },
    ],
  },
  {
    id: 'casa-alto-pinheiros',
    title: 'Casa Alto de Pinheiros',
    address: 'Rua Cerro Corá, 450',
    location: 'Alto de Pinheiros, São Paulo',
    type: 'Casa',
    purpose: 'Venda',
    price: 'R$ 3.800.000',
    status: 'Em análise',
    broker: 'Marcos Lima',
    updatedAt: 'Há 5 dias',
    imageUrl:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=160&q=80',
    heroImageUrl:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1280&q=84',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=82',
        label: 'Fachada e jardim',
        kind: 'Foto',
      },
      {
        url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=82',
        label: 'Área externa',
        kind: 'Foto',
      },
      { ...apartmentMedia[0], label: 'Planta térrea', kind: 'Planta' },
    ],
    summary: {
      bedrooms: '4',
      bathrooms: '4',
      parkingSpaces: '3',
      area: '310m²',
      condominium: 'Isento',
      iptu: 'R$ 980/mês',
    },
    pricing: {
      rent: 'Não anunciado',
      sale: 'R$ 3.800.000',
      condominium: 'Isento',
      iptu: 'R$ 980/mês',
      administrationFee: '2% na venda',
      securityDeposit: 'Não aplicável',
      lastAdjustment: 'Em análise documental',
    },
    participants: [
      { name: 'Paulo Mendes', role: 'Proprietário', initials: 'PM' },
      { name: 'Marcos Lima', role: 'Corretor', initials: 'ML' },
    ],
    activityHistory: [
      { label: 'Documentação enviada para análise', date: 'há 5 dias', tone: 'warning' },
      { label: 'Cadastro do imóvel efetuado', date: 'há 2 semanas', tone: 'neutral' },
    ],
  },
  {
    id: 'studio-bela-vista',
    title: 'Studio Bela Vista',
    address: 'Avenida Nove de Julho, 2100',
    location: 'Bela Vista, São Paulo',
    type: 'Studio',
    purpose: 'Aluguel',
    price: 'R$ 2.400/mês',
    status: 'Vencendo',
    broker: 'Ana Paula',
    updatedAt: 'Há 1 semana',
    imageUrl:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=160&q=80',
    heroImageUrl:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1280&q=84',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=82',
        label: 'Dormitório',
        kind: 'Foto',
      },
      {
        url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=82',
        label: 'Studio integrado',
        kind: 'Foto',
      },
      { ...apartmentMedia[1], label: 'Vídeo de apresentação', kind: 'Vídeo' },
    ],
    summary: {
      bedrooms: '1',
      bathrooms: '1',
      parkingSpaces: '0',
      area: '34m²',
      condominium: 'R$ 520',
      iptu: 'R$ 140/mês',
    },
    pricing: {
      rent: 'R$ 2.400/mês',
      sale: 'Não anunciado',
      condominium: 'R$ 520',
      iptu: 'R$ 140/mês',
      administrationFee: '7% sobre aluguel',
      securityDeposit: '2 aluguéis',
      lastAdjustment: 'Publicação vence em 7 dias',
    },
    participants: [
      { name: 'Renata Ferraz', role: 'Proprietária', initials: 'RF' },
      { name: 'Ana Paula', role: 'Corretora', initials: 'AP' },
    ],
    activityHistory: [
      { label: 'Publicação próxima do vencimento', date: 'há 1 semana', tone: 'warning' },
      { label: 'Cadastro do imóvel efetuado', date: 'há 1 mês', tone: 'neutral' },
    ],
  },
  {
    id: 'apt-moema-2q',
    title: 'Apt Moema 2q',
    address: 'Alameda dos Maracatins, 320',
    location: 'Moema, São Paulo',
    type: 'Apartamento',
    purpose: 'Aluguel',
    price: 'R$ 4.800/mês',
    status: 'Inativo',
    broker: 'Clara G.',
    updatedAt: 'Há 2 semanas',
    imageUrl:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=160&q=80',
    heroImageUrl:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1280&q=84',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=82',
        label: 'Sala principal',
        kind: 'Foto',
      },
      {
        url: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=900&q=82',
        label: 'Cozinha e jantar',
        kind: 'Foto',
      },
      { ...apartmentMedia[2], label: 'Fotos arquivadas', kind: 'Foto' },
    ],
    summary: {
      bedrooms: '2',
      bathrooms: '2',
      parkingSpaces: '1',
      area: '78m²',
      condominium: 'R$ 940',
      iptu: 'R$ 260/mês',
    },
    pricing: {
      rent: 'R$ 4.800/mês',
      sale: 'Não anunciado',
      condominium: 'R$ 940',
      iptu: 'R$ 260/mês',
      administrationFee: '8% sobre aluguel',
      securityDeposit: 'Cadastro pausado',
      lastAdjustment: 'Inativado há 2 semanas',
    },
    participants: [
      { name: 'Clara G.', role: 'Corretora', initials: 'CG' },
      { name: 'Vila Nova Prime', role: 'Imobiliária', initials: 'VN' },
    ],
    activityHistory: [
      { label: 'Imóvel marcado como inativo', date: 'há 2 semanas', tone: 'error' },
      { label: 'Cadastro do imóvel efetuado', date: 'há 2 meses', tone: 'neutral' },
    ],
  },
]

export function getDashboardPropertyById(propertyId: string) {
  return dashboardProperties.find((property) => property.id === propertyId)
}
