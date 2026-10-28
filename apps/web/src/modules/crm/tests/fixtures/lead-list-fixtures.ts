import ptCommon from '@/i18n/messages/pt-BR/common.json'
import enCommon from '@/i18n/messages/en-US/common.json'
import esCommon from '@/i18n/messages/es-ES/common.json'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { DashboardLead } from '../../types/lead'
import { formatLeadRelativeDate } from '../../utils/format-lead'
import { formatMonthlyCurrency } from '../../utils/formatters'

import type { FixtureLead } from '../../types/fixtures'

export const leadListFixtures: readonly FixtureLead[] = [
  {
    id: 'lead-fixture-001',
    name: 'Joao Silva',
    budgetAmount: 1_200_000,
    budgetKind: 'sale',
    phone: '(11) 98820-1400',
    email: 'joao.silva@email.com',
    minutesAgo: 120,
    interest: 'Apartamento 3 quartos',
    source: 'MARKETPLACE',
    broker: 'Amanda Keller',
    stage: 'NEW',
    opportunityId: null,
  },
  {
    id: 'lead-fixture-002',
    name: 'Maria Fernandes',
    budgetAmount: 850_000,
    budgetKind: 'sale',
    phone: '(11) 97744-2211',
    email: 'maria.fernandes@email.com',
    minutesAgo: 1_440,
    interest: 'Casa em condominio',
    source: 'INSTAGRAM',
    broker: 'Rafael Prado',
    stage: 'IN_CONTACT',
    opportunityId: null,
  },
  {
    id: 'lead-fixture-003',
    name: 'Rafael Lima',
    budgetAmount: 4_800,
    budgetKind: 'rent',
    phone: '(11) 96550-7730',
    email: 'rafael.lima@email.com',
    minutesAgo: 4_320,
    interest: 'Studio mobiliado',
    source: 'WHATSAPP',
    broker: 'Camila Nogueira',
    stage: 'VISIT_SCHEDULED',
    opportunityId: null,
  },
  {
    id: 'lead-fixture-004',
    name: 'Carla Rocha',
    budgetAmount: 2_400_000,
    budgetKind: 'sale',
    phone: '(11) 94018-8822',
    email: 'carla.rocha@email.com',
    minutesAgo: 7_200,
    interest: 'Cobertura duplex',
    source: 'WEBSITE',
    broker: 'Bruno Martins',
    stage: 'PROPOSAL',
    opportunityId: 'opportunity-fixture-carla',
  },
  {
    id: 'lead-fixture-005',
    name: 'Guilherme Santos',
    budgetAmount: 720_000,
    budgetKind: 'sale',
    phone: '(11) 98221-5570',
    email: 'guilherme.santos@email.com',
    minutesAgo: 10_080,
    interest: 'Apartamento compacto',
    source: 'REFERRAL',
    broker: 'Livia Torres',
    stage: 'NEW',
    opportunityId: null,
  },
  {
    id: 'lead-fixture-006',
    name: 'Patricia Lima',
    budgetAmount: 9_500,
    budgetKind: 'rent',
    phone: '(11) 99173-6604',
    email: 'patricia.lima@email.com',
    minutesAgo: 14_400,
    interest: 'Casa comercial',
    source: 'MARKETPLACE',
    broker: 'Henrique Duarte',
    stage: 'IN_CONTACT',
    opportunityId: null,
  },
]

export function getLeadListFixtures(locale: AppLocale, now = new Date()): DashboardLead[] {
  return leadListFixtures.map(({ budgetAmount, budgetKind, minutesAgo, ...lead }) => {
    const lastContactAt = new Date(now.getTime() - minutesAgo * 60_000).toISOString()
    return {
      ...lead,
      budget:
        budgetKind === 'rent'
          ? formatMonthlyCurrency(
              budgetAmount,
              { 'pt-BR': ptCommon, 'en-US': enCommon, 'es-ES': esCommon }[locale].perMonth,
              locale,
            )
          : new Intl.NumberFormat(locale, {
              style: 'currency',
              currency: 'BRL',
              notation: 'compact',
              maximumFractionDigits: 1,
            }).format(budgetAmount),
      budgetAmount,
      lastContactAt,
      lastContact: formatLeadRelativeDate(lastContactAt, locale, now),
    }
  })
}
