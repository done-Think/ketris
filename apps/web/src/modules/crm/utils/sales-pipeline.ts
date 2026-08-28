import { salesPipelineStages } from '../config/sales-pipeline-stages'
import type { Opportunity } from '../types/opportunity'
import type { PublicPropertySummary } from '../types/property'
import type { SalesPipelineProjectedTotal, SalesPipelineStageId } from '../types/sales-pipeline'
import { formatCurrency, formatMonthlyCurrency } from './formatters'

export function getOpportunityStageId(
  opportunity: Opportunity,
  fixtureMode: boolean,
  fixtureStageByOpportunityId: ReadonlyMap<string, SalesPipelineStageId>,
): SalesPipelineStageId | undefined {
  if (fixtureMode) return fixtureStageByOpportunityId.get(opportunity.id)

  return salesPipelineStages.find((stage) => stage.statuses.includes(opportunity.status))?.id
}

export function matchesSalesPipelineSearch(
  opportunity: Opportunity,
  property: PublicPropertySummary | undefined,
  search: string,
): boolean {
  if (!search) return true

  return [
    opportunity.interessadoNome,
    opportunity.interessadoEmail,
    opportunity.interessadoTelefone,
    property?.titulo,
    property?.tipo,
    property?.bairro,
    property?.cidade,
    opportunity.imovelId,
  ].some((value) => value?.toLocaleLowerCase('pt-BR').includes(search))
}

export function getProjectedTotals(
  opportunities: readonly Opportunity[],
  propertiesById: ReadonlyMap<string, PublicPropertySummary>,
): readonly SalesPipelineProjectedTotal[] {
  const totals = opportunities.reduce(
    (result, opportunity) => {
      const purpose = propertiesById.get(opportunity.imovelId)?.finalidade

      if (purpose === 'ALUGUEL') result.rental += opportunity.valorProposto
      else if (purpose === 'VENDA') result.sale += opportunity.valorProposto
      else result.unclassified += opportunity.valorProposto

      return result
    },
    { rental: 0, sale: 0, unclassified: 0 },
  )

  return [
    ...(totals.rental
      ? [
          {
            label: 'Aluguel',
            labelKey: 'rent' as const,
            value: formatMonthlyCurrency(totals.rental),
          },
        ]
      : []),
    ...(totals.sale
      ? [{ label: 'Venda', labelKey: 'sale' as const, value: formatCurrency(totals.sale) }]
      : []),
    ...(totals.unclassified
      ? [
          {
            label: 'Sem categoria',
            labelKey: 'uncategorized' as const,
            value: formatCurrency(totals.unclassified),
          },
        ]
      : []),
  ]
}
