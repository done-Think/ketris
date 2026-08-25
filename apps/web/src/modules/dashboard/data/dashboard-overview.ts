import type {
  DashboardMetric,
  DashboardPerformancePoint,
  DashboardRecentLead,
  DashboardUpcomingActivity,
} from '../types/dashboard-overview'

export const dashboardMetrics: DashboardMetric[] = [
  { label: 'Leads ativos', value: '24', caption: '+3 hoje', tone: 'success' },
  { label: 'Visitas mês', value: '18', caption: '+12% vs mês pass.', tone: 'success' },
  { label: 'Propostas', value: '5', caption: '2 pendentes', tone: 'danger' },
  { label: 'Faturamento', value: 'R$ 45.200', caption: '+8% meta', tone: 'success' },
]

export const dashboardPerformance: DashboardPerformancePoint[] = [
  { month: 'Fev', value: 38 },
  { month: 'Mar', value: 46 },
  { month: 'Abr', value: 35 },
  { month: 'Mai', value: 58 },
  { month: 'Jun', value: 64 },
  { month: 'Jul', value: 44 },
]

export const dashboardUpcomingActivities: DashboardUpcomingActivity[] = [
  {
    id: 'visit-apt-jardins',
    time: '10:30',
    title: 'Visita - Apt Jardins',
    contact: 'Ricardo Mendes',
    accent: 'magenta',
    type: 'visit',
    client: {
      name: 'Ricardo Mendes',
      phone: '(11) 98422-1930',
    },
    meetingTime: '10:20',
    location: {
      name: 'Edifício Maison Jardins',
      address: 'Alameda Franca, 1188 - Jardins, São Paulo',
      latitude: -23.5659,
      longitude: -46.6706,
      directionsUrl:
        'https://www.openstreetmap.org/directions?to=-23.5659%2C-46.6706#map=16/-23.5659/-46.6706',
    },
    notes:
      'Cliente busca planta ampla, varanda integrada e duas vagas. Confirmar documentação do condomínio antes da visita.',
    property: {
      title: 'Apartamento Jardins',
      imageUrl:
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=82',
      address: 'Alameda Franca, Jardins',
      price: 'R$ 2.850.000',
      area: '142 m²',
      bedrooms: '3 quartos',
      summary:
        'Apartamento reformado com living integrado, varanda gourmet, suíte master e excelente iluminação natural.',
      owner: {
        name: 'Marina Costa',
        phone: '(11) 97654-2210',
      },
    },
  },
  {
    id: 'meeting-alignment',
    time: '14:00',
    title: 'Reunião - Alinhamento',
    contact: 'Sr. Oliveira',
    accent: 'info',
    type: 'meeting',
    client: {
      name: 'Henrique Oliveira',
      phone: '(11) 99118-4502',
    },
    meetingTime: '14:00',
    location: {
      name: 'Escritório Ketris',
      address: 'Av. Paulista, 1000 - Bela Vista, São Paulo',
      latitude: -23.5634,
      longitude: -46.6542,
      directionsUrl:
        'https://www.openstreetmap.org/directions?to=-23.5634%2C-46.6542#map=16/-23.5634/-46.6542',
    },
    notes:
      'Revisar estratégia de venda, faixa de negociação e próximos anúncios do imóvel antes de enviar proposta comercial.',
  },
  {
    id: 'follow-up-ana-paula',
    time: '16:00',
    title: 'Follow-up',
    contact: 'Ana Paula',
    accent: 'warning',
    type: 'follow-up',
    client: {
      name: 'Ana Paula',
      phone: '(11) 98876-3041',
    },
    meetingTime: '16:00',
    location: {
      name: 'Ligação agendada',
      address: 'Contato remoto pelo telefone cadastrado',
      latitude: -23.556,
      longitude: -46.661,
      directionsUrl:
        'https://www.openstreetmap.org/directions?to=-23.5560%2C-46.6610#map=14/-23.5560/-46.6610',
    },
    notes:
      'Retomar objeções sobre prazo de mudança e enviar comparativo atualizado de studios em Pinheiros.',
  },
]

export const dashboardRecentLeads: DashboardRecentLead[] = [
  {
    name: 'Guilherme Santos',
    phone: '(11) 98124-7720',
    interest: 'Cobertura Jardins',
    status: 'Novo',
    origin: 'Anúncio Instagram',
    reportedNeed:
      'Relatou que precisa de uma cobertura pronta para morar, com area gourmet e privacidade para receber a familia aos fins de semana.',
    lookingFor:
      'Cobertura com 3 suites, varanda ampla, duas vagas e condominio com lazer completo.',
    budgetRange: 'R$ 2.700.000 a R$ 3.200.000',
    downPayment: 'R$ 900.000',
    financingStatus: 'Pre-aprovado pelo banco, aguardando simulacao final.',
    desiredRegions: ['Jardins', 'Itaim Bibi', 'Moema'],
    timeline: 'Quer visitar imoveis ainda nesta semana e decidir em ate 45 dias.',
    notes: 'Priorizar unidades silenciosas, andar alto e documentacao sem pendencias.',
  },
  {
    name: 'Ana Clara Mendes',
    phone: '(11) 99718-4308',
    interest: 'Casa Condomínio',
    status: 'Em Andamento',
    origin: 'Indicação',
    reportedNeed:
      'Busca mais seguranca e area externa para os filhos, sem abrir mao de acesso rapido a escolas bilingues.',
    lookingFor: 'Casa em condominio com 4 quartos, quintal, escritorio e pelo menos 3 vagas.',
    budgetRange: 'R$ 3.500.000 a R$ 4.400.000',
    downPayment: 'R$ 1.400.000',
    financingStatus: 'Vai financiar parte do valor; renda familiar ja validada pelo assessor.',
    desiredRegions: ['Alto da Boa Vista', 'Brooklin', 'Chacara Flora'],
    timeline: 'Mudanca planejada para o proximo semestre.',
    notes: 'Enviar opcoes com baixa taxa condominial e boa insolacao no periodo da tarde.',
  },
  {
    name: 'Juliana Rocha',
    phone: '(11) 94362-1189',
    interest: 'Apto Vila Madalena',
    status: 'Qualificado',
    origin: 'Portal Imobiliário',
    reportedNeed:
      'Quer sair do aluguel e morar perto do trabalho, com boa mobilidade e comercio caminhavel.',
    lookingFor: 'Apartamento de 2 quartos, varanda, vaga e predio novo ou recem-reformado.',
    budgetRange: 'R$ 980.000 a R$ 1.250.000',
    downPayment: 'R$ 280.000',
    financingStatus: 'Financiamento em analise; precisa comparar CET entre dois bancos.',
    desiredRegions: ['Vila Madalena', 'Pinheiros', 'Sumarezinho'],
    timeline: 'Pretende comprar em ate 90 dias.',
    notes: 'Evitar ruas muito movimentadas; aceita andar baixo se houver boa planta.',
  },
  {
    name: 'Carlos Eduardo',
    phone: '(11) 95640-8821',
    interest: 'Studio Pinheiros',
    status: 'Pendente',
    origin: 'Site Ketris',
    reportedNeed: 'Procura studio para investimento, com liquidez para locacao de media temporada.',
    lookingFor:
      'Studio mobiliavel, perto de metro, condominio enxuto e possibilidade de locacao flexivel.',
    budgetRange: 'R$ 520.000 a R$ 680.000',
    downPayment: 'Pagamento a vista se houver desconto relevante.',
    financingStatus: 'Nao depende de financiamento.',
    desiredRegions: ['Pinheiros', 'Faria Lima', 'Vila Olimpia'],
    timeline: 'Pode fechar rapido se o retorno estimado ficar acima da meta.',
    notes: 'Preparar comparativo de aluguel projetado, vacancia e custos mensais.',
  },
]
