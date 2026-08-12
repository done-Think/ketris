import { brand, surface } from '@shared/theme/tokens'

export type BrokerProfileTheme = {
  label: string
  tone: string
  accent: string
  cover: string
  signature: string
  summary: string
  method: string[]
}

const defaultBrokerProfileTheme: BrokerProfileTheme = {
  label: 'Atendimento regional',
  accent: brand.magenta[500],
  tone: surface.app,
  cover:
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1400&q=82',
  signature: 'Atendimento especializado com carteira regional.',
  summary: 'Selecao de imoveis alinhada ao perfil de busca dos clientes.',
  method: ['Curadoria inicial', 'Visitas guiadas', 'Negociacao acompanhada'],
}

export const brokerProfileThemes: Record<string, BrokerProfileTheme> = {
  'marina-costa': {
    label: 'Curadoria residencial',
    tone: brand.magenta[50],
    accent: brand.magenta[500],
    cover:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=82',
    signature: 'Jardins com leitura precisa de planta, luz e rotina.',
    summary: 'Apartamentos prontos para morar em enderecos centrais e bem servidos.',
    method: ['Visitas objetivas', 'Comparativo de condominio', 'Negociacao de entrada'],
  },
  'thiago-santos': {
    label: 'Carteira urbana',
    tone: brand.graphite[50],
    accent: brand.graphite[500],
    cover:
      'https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1400&q=82',
    signature: 'Studios e lofts para quem quer morar com mobilidade.',
    summary: 'Studios, lofts e plantas compactas para uma rotina mais flexivel.',
    method: ['Mapa de mobilidade', 'Custo mensal claro', 'Perfil de investimento'],
  },
  'juliana-mendes': {
    label: 'Alto padrao',
    tone: brand.magenta[50],
    accent: brand.magenta[700],
    cover:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=82',
    signature: 'Coberturas e apartamentos amplos no eixo Faria Lima.',
    summary: 'Imoveis amplos com foco em vista, privacidade e localizacao premium.',
    method: ['Curadoria reservada', 'Analise de vista', 'Agenda sob demanda'],
  },
  'renato-alves': {
    label: 'Casas familiares',
    tone: '#F2F6EF',
    accent: '#3F6D46',
    cover:
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=82',
    signature: 'Casas com area externa, privacidade e rotina familiar.',
    summary: 'Selecao residencial para familias que precisam de espaco e previsibilidade.',
    method: ['Leitura de entorno', 'Checklist familiar', 'Rotas de escola'],
  },
  'camila-rocha': {
    label: 'Comercial enxuto',
    tone: '#EFF4F8',
    accent: '#255C7A',
    cover:
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=82',
    signature: 'Salas prontas para equipes pequenas e operacoes flexiveis.',
    summary: 'Carteira comercial para empresas que precisam decidir sem perder tracao.',
    method: ['Infraestrutura pronta', 'Capacidade por equipe', 'Contrato objetivo'],
  },
  'bianca-azevedo': {
    label: 'Compra consultiva',
    tone: '#F6F1EC',
    accent: '#8A5A3B',
    cover:
      'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1400&q=82',
    signature: 'Moema e entorno com olhar de compra patrimonial.',
    summary: 'Consultoria para comparar localizacao, liquidez e qualidade da planta.',
    method: ['Tese de compra', 'Liquidez por bairro', 'Visita comparativa'],
  },
  'felipe-andrade': {
    label: 'Eixo corporativo',
    tone: '#EEF3F7',
    accent: '#1F5A73',
    cover:
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=82',
    signature: 'Brooklin e Berrini com leitura comercial e residencial.',
    summary: 'Carteira para quem precisa equilibrar operacao, endereco e potencial de compra.',
    method: ['Mapa de acesso', 'Infraestrutura do predio', 'Potencial de revenda'],
  },
  'lara-queiroz': {
    label: 'Vida de bairro',
    tone: '#F1F6F4',
    accent: '#2C6B57',
    cover:
      'https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1400&q=82',
    signature: 'Pinheiros com foco em ruas caminhaveis e rotina pratica.',
    summary: 'Selecao para quem valoriza mobilidade, comercio local e apartamentos bem resolvidos.',
    method: ['Roteiro a pe', 'Comparacao por rua', 'Perfil de rotina'],
  },
  'eduardo-martins': {
    label: 'Familias urbanas',
    tone: '#F6F3EF',
    accent: '#765232',
    cover:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=82',
    signature: 'Vila Mariana para familias que querem espaco sem sair da cidade.',
    summary: 'Atendimento para comparar planta, deslocamento e qualidade do entorno.',
    method: ['Checklist familiar', 'Rotas de servicos', 'Analise de planta'],
  },
}

export function getBrokerProfileTheme(brokerId: string) {
  return brokerProfileThemes[brokerId] ?? defaultBrokerProfileTheme
}
