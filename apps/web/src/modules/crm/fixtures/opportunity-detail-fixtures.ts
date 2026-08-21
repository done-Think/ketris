import { brand } from '@shared/theme/tokens'

import type { OpportunityDetailFixture } from '../types/opportunity-detail'
import { salesPipelineFixtures } from './sales-pipeline-fixtures'

export const ricardoMendesOpportunityId = 'pipeline-fixture-ricardo-mendes'

function createRicardoMendesOpportunityDetailFixture(): OpportunityDetailFixture | undefined {
  const pipelineFixture = salesPipelineFixtures.find(
    ({ opportunity }) => opportunity.id === ricardoMendesOpportunityId,
  )

  if (!pipelineFixture) {
    return undefined
  }

  return {
    opportunity: {
      ...pipelineFixture.opportunity,
      interessadoNome: 'Ricardo Mendes',
      interessadoEmail: 'ricardo.mendes@email.com',
      interessadoTelefone: '(11) 98722-1200',
      valorProposto: 4800,
    },
    stage: {
      label: 'Qualificação',
      color: brand.semantic.info,
      softColor: '#EAF2FF',
    },
    presentation: {
      interestDetails: {
        interest: 'Apt 3q Jardins (Moema / Pinheiros)',
        budget: 'R$ 4.500 a R$ 5.500/mês',
        deadline: 'Imediato (Mudança em 30 dias)',
      },
      suggestedProperties: [
        {
          id: 'apt-jardins-premium',
          title: 'Apto Jardins Premium',
          imageUrl:
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=82',
          meta: 'Apt 120m² · 3 Quartos · Jardins',
          priceLabel: 'R$ 4.500/mês',
          matchPercentage: 84,
          href: '/imoveis/apartamento-jardins',
        },
        {
          id: 'vila-mariana-unique',
          title: 'Vila Mariana Unique',
          imageUrl:
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=82',
          meta: 'Studio 48m² · Mobiliado Premium · V. Mariana',
          priceLabel: 'R$ 3.900/mês',
          matchPercentage: 88,
          href: '/imoveis/studio-vila-madalena',
        },
        {
          id: 'pinheiros-office-spot',
          title: 'Pinheiros Office Spot',
          imageUrl:
            'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
          meta: 'Conjunto comercial · 75m² · Pinheiros',
          priceLabel: 'R$ 5.200/mês',
          matchPercentage: 75,
          href: '/imoveis/sala-comercial-paulista',
        },
      ],
      activities: [
        {
          id: 'phone-call-today',
          kind: 'phone',
          title: 'Chamada telefônica',
          dateLabel: 'Hoje, 11:15',
          description: 'Ricardo gostou do Apto Jardins e agendou visita para quinta-feira.',
        },
        {
          id: 'email-yesterday',
          kind: 'email',
          title: 'E-mail enviado',
          dateLabel: 'Ontem, 16:30',
          description: 'Apresentação dos 3 imóveis sugeridos com o perfil solicitado.',
        },
        {
          id: 'opportunity-created',
          kind: 'opportunity',
          title: 'Oportunidade criada',
          dateLabel: '24 Set, 09:10',
          description: 'Lead originado do portal imobiliário com interesse de aluguel residencial.',
        },
      ],
      nextActions: [
        {
          id: 'apt-jardins-visit',
          kind: 'visit',
          title: 'Visita no Apto Jardins Premium',
          scheduleLabel: 'Quinta-feira, 14:00 · Responsável: Marcelo Silva',
        },
        {
          id: 'proposal-follow-up',
          kind: 'followUp',
          title: 'Follow-up da proposta e documentação',
          scheduleLabel: 'Sexta-feira, 10:00 · Responsável: Marcelo Silva',
        },
      ],
    },
  }
}

const ricardoMendesOpportunityDetailFixture =
  process.env.NODE_ENV === 'production' ? undefined : createRicardoMendesOpportunityDetailFixture()

export const opportunityDetailFixturesByOpportunityId: Readonly<
  Record<string, OpportunityDetailFixture>
> = ricardoMendesOpportunityDetailFixture
  ? { [ricardoMendesOpportunityId]: ricardoMendesOpportunityDetailFixture }
  : {}

export function getOpportunityDetailFixture(
  opportunityId: string,
): OpportunityDetailFixture | undefined {
  return opportunityDetailFixturesByOpportunityId[opportunityId]
}
