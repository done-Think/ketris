import { brand, profileThemeColors, surface } from '@shared/theme/tokens'

import type { BrokerProfileTheme } from '../types/broker-profile-theme'

const defaultBrokerProfileTheme: BrokerProfileTheme = {
  label: 'Atendimento regional',
  accent: brand.magenta[500],
  tone: surface.app,
  cover:
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1400&q=82',
  signature: 'Atendimento especializado com carteira regional.',
  summary: 'Seleção de imóveis alinhada ao perfil de busca dos clientes.',
  method: ['Curadoria inicial', 'Visitas guiadas', 'Negociação acompanhada'],
}

export const brokerProfileThemes: Record<string, BrokerProfileTheme> = {
  'marina-costa': {
    label: 'Curadoria residencial',
    tone: brand.magenta[50],
    accent: brand.magenta[500],
    cover:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=82',
    signature: 'Jardins com leitura precisa de planta, luz e rotina.',
    summary: 'Apartamentos prontos para morar em endereços centrais e bem servidos.',
    method: ['Visitas objetivas', 'Comparativo de condomínio', 'Negociação de entrada'],
  },
  'thiago-santos': {
    label: 'Carteira urbana',
    tone: brand.graphite[50],
    accent: brand.graphite[500],
    cover:
      'https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1400&q=82',
    signature: 'Studios e lofts para quem quer morar com mobilidade.',
    summary: 'Studios, lofts e plantas compactas para uma rotina mais flexível.',
    method: ['Mapa de mobilidade', 'Custo mensal claro', 'Perfil de investimento'],
  },
  'juliana-mendes': {
    label: 'Alto padrão',
    tone: brand.magenta[50],
    accent: brand.magenta[700],
    cover:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=82',
    signature: 'Coberturas e apartamentos amplos no eixo Faria Lima.',
    summary: 'Imóveis amplos com foco em vista, privacidade e localização premium.',
    method: ['Curadoria reservada', 'Análise de vista', 'Agenda sob demanda'],
  },
  'renato-alves': {
    label: 'Casas familiares',
    tone: profileThemeColors.familyHomes.tone,
    accent: profileThemeColors.familyHomes.accent,
    cover:
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=82',
    signature: 'Casas com área externa, privacidade e rotina familiar.',
    summary: 'Seleção residencial para famílias que precisam de espaço e previsibilidade.',
    method: ['Leitura de entorno', 'Checklist familiar', 'Rotas de escola'],
  },
  'camila-rocha': {
    label: 'Comercial enxuto',
    tone: profileThemeColors.commercialBlue.tone,
    accent: profileThemeColors.commercialBlue.accent,
    cover:
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=82',
    signature: 'Salas prontas para equipes pequenas e operações flexíveis.',
    summary: 'Carteira comercial para empresas que precisam decidir sem perder tração.',
    method: ['Infraestrutura pronta', 'Capacidade por equipe', 'Contrato objetivo'],
  },
  'bianca-azevedo': {
    label: 'Compra consultiva',
    tone: profileThemeColors.warmConsulting.tone,
    accent: profileThemeColors.warmConsulting.accent,
    cover:
      'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1400&q=82',
    signature: 'Moema e entorno com olhar de compra patrimonial.',
    summary: 'Consultoria para comparar localização, liquidez e qualidade da planta.',
    method: ['Tese de compra', 'Liquidez por bairro', 'Visita comparativa'],
  },
  'felipe-andrade': {
    label: 'Eixo corporativo',
    tone: profileThemeColors.corporateBlue.tone,
    accent: profileThemeColors.corporateBlue.accent,
    cover:
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=82',
    signature: 'Brooklin e Berrini com leitura comercial e residencial.',
    summary: 'Carteira para quem precisa equilibrar operação, endereço e potencial de compra.',
    method: ['Mapa de acesso', 'Infraestrutura do prédio', 'Potencial de revenda'],
  },
  'lara-queiroz': {
    label: 'Vida de bairro',
    tone: profileThemeColors.neighborhoodGreen.tone,
    accent: profileThemeColors.neighborhoodGreen.accent,
    cover:
      'https://images.unsplash.com/photo-1600607688960-e095ff83135c?auto=format&fit=crop&w=1400&q=82',
    signature: 'Pinheiros com foco em ruas caminháveis e rotina prática.',
    summary: 'Seleção para quem valoriza mobilidade, comércio local e apartamentos bem resolvidos.',
    method: ['Roteiro a pé', 'Comparação por rua', 'Perfil de rotina'],
  },
  'eduardo-martins': {
    label: 'Famílias urbanas',
    tone: profileThemeColors.urbanFamily.tone,
    accent: profileThemeColors.urbanFamily.accent,
    cover:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=82',
    signature: 'Vila Mariana para famílias que querem espaço sem sair da cidade.',
    summary: 'Atendimento para comparar planta, deslocamento e qualidade do entorno.',
    method: ['Checklist familiar', 'Rotas de serviços', 'Análise de planta'],
  },
}

export function getBrokerProfileTheme(brokerId: string) {
  return brokerProfileThemes[brokerId] ?? defaultBrokerProfileTheme
}
