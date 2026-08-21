import { brand, supportColor } from '@shared/theme/tokens'

import type { OpportunityStatus } from '../types/opportunity'
import type {
  SalesPipelineFixture,
  SalesPipelineFixtureInput,
  SalesPipelinePreviewIndicator,
  SalesPipelineStageId,
} from '../types/sales-pipeline'

const previewIndicators = {
  green: { color: brand.semantic.success, label: 'Status verde' },
  yellow: { color: brand.semantic.warning, label: 'Status amarelo' },
  orange: { color: supportColor.orange, label: 'Status laranja' },
} as const satisfies Record<string, SalesPipelinePreviewIndicator>

const statusByStage: Record<SalesPipelineStageId, OpportunityStatus> = {
  prospecting: 'RASCUNHO',
  qualification: 'ENVIADA',
  proposal: 'ENVIADA',
  negotiation: 'EM_NEGOCIACAO',
  closed: 'ACEITA',
}

function getRelativeDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString()
}

function createFixture({
  slug,
  stageId,
  name,
  propertyTitle,
  value,
  daysAgo,
  indicator,
}: SalesPipelineFixtureInput): SalesPipelineFixture {
  const opportunityId = `pipeline-fixture-${slug}`
  const propertyId = `pipeline-fixture-property-${slug}`
  const relativeDate = getRelativeDate(daysAgo)

  return {
    stageId,
    opportunity: {
      id: opportunityId,
      tenantId: 'pipeline-visual-preview',
      imovelId: propertyId,
      interessadoNome: name,
      interessadoEmail: `${slug}@preview.ketris.local`,
      interessadoTelefone: null,
      valorProposto: value,
      prazoContratoMeses: null,
      inicioPretendido: null,
      garantiaContratual: 'NENHUMA',
      condicoesEspeciais: [],
      observacoes: null,
      status: statusByStage[stageId],
      arquivadaEm: null,
      createdAt: relativeDate,
      updatedAt: relativeDate,
    },
    property: {
      id: propertyId,
      titulo: propertyTitle,
      finalidade: 'ALUGUEL',
      tipo: 'Imóvel',
      valor: value,
      condominio: null,
      iptu: null,
      quartos: null,
      banheiros: null,
      vagas: null,
      areaM2: null,
      cidade: 'São Paulo',
      bairro: propertyTitle.split(' - ').at(-1) ?? null,
      capaUrl: null,
      publicadoEm: relativeDate,
    },
    presentation: {
      indicatorColor: indicator.color,
      indicatorLabel: indicator.label,
      relativeDateLabel: `${daysAgo} ${daysAgo === 1 ? 'dia' : 'dias'}`,
    },
  }
}

function createSalesPipelineFixtures(): readonly SalesPipelineFixture[] {
  return [
    createFixture({
      slug: 'carlos-eduardo',
      stageId: 'prospecting',
      name: 'Carlos Eduardo',
      propertyTitle: 'Ap 3 quartos - Moema',
      value: 5200,
      daysAgo: 2,
      indicator: previewIndicators.green,
    }),
    createFixture({
      slug: 'leticia-ramos',
      stageId: 'prospecting',
      name: 'Letícia Ramos',
      propertyTitle: 'Casa comercial - Pinheiros',
      value: 12000,
      daysAgo: 5,
      indicator: previewIndicators.yellow,
    }),
    createFixture({
      slug: 'rui-barbosa',
      stageId: 'prospecting',
      name: 'Rui Barbosa',
      propertyTitle: 'Studio mobiliado - Itaim',
      value: 3800,
      daysAgo: 1,
      indicator: previewIndicators.green,
    }),
    createFixture({
      slug: 'ricardo-mendes',
      stageId: 'qualification',
      name: 'Ricardo Mendes',
      propertyTitle: 'Apt 3q Jardins',
      value: 4800,
      daysAgo: 5,
      indicator: previewIndicators.orange,
    }),
    createFixture({
      slug: 'clara-antunes',
      stageId: 'qualification',
      name: 'Clara Antunes',
      propertyTitle: 'Cobertura - Perdizes',
      value: 14500,
      daysAgo: 12,
      indicator: previewIndicators.green,
    }),
    createFixture({
      slug: 'bruno-campina',
      stageId: 'proposal',
      name: 'Bruno Campina',
      propertyTitle: 'Galpão industrial - Lapa',
      value: 8900,
      daysAgo: 3,
      indicator: previewIndicators.green,
    }),
    createFixture({
      slug: 'daniela-flores',
      stageId: 'proposal',
      name: 'Daniela Flores',
      propertyTitle: 'Ap reformado - Vila Mariana',
      value: 4200,
      daysAgo: 8,
      indicator: previewIndicators.orange,
    }),
    createFixture({
      slug: 'fernando-costa',
      stageId: 'negotiation',
      name: 'Fernando Costa',
      propertyTitle: 'Conjunto Comercial - Paulista',
      value: 18000,
      daysAgo: 15,
      indicator: previewIndicators.orange,
    }),
    createFixture({
      slug: 'helena-vaz',
      stageId: 'negotiation',
      name: 'Helena Vaz',
      propertyTitle: 'Casa em condomínio - Morumbi',
      value: 11500,
      daysAgo: 4,
      indicator: previewIndicators.green,
    }),
    createFixture({
      slug: 'gabriel-henrique',
      stageId: 'closed',
      name: 'Gabriel Henrique',
      propertyTitle: 'Studio - Consolação',
      value: 3500,
      daysAgo: 20,
      indicator: previewIndicators.green,
    }),
    createFixture({
      slug: 'silvia-souza',
      stageId: 'closed',
      name: 'Silvia Souza',
      propertyTitle: 'Ap Duplex - Campo Belo',
      value: 9500,
      daysAgo: 24,
      indicator: previewIndicators.green,
    }),
  ]
}

export const salesPipelineFixtures: readonly SalesPipelineFixture[] =
  process.env.NODE_ENV === 'production' ? [] : createSalesPipelineFixtures()
