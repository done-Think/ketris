'use client'

import { useCrmFormatter } from '../../hooks/use-crm-formatter'

import type { AppLocale } from '@/i18n/types/locale.types'
import { Alert, Button } from '@mui/material'
import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { useInfiniteOpportunities } from '../../hooks/use-opportunities'
import type { CrmPipelineColumnProps } from '../../types/sales-pipeline'
import { PipelineStageColumn } from './PipelineStageColumn'

export function CrmPipelineColumn({ search, stage, visible }: CrmPipelineColumnProps) {
  const format = useCrmFormatter()
  const { status: sessionStatus } = useSession()
  const locale = useLocale() as AppLocale
  const t = useTranslations('crm.pipeline')
  const q = useDebouncedValue(search)
  const query = useInfiniteOpportunities(
    {
      q: q || undefined,
      statuses: [...stage.statuses],
      pageSize: 5,
      summaryScope: 'results',
      locale,
    },
    visible && stage.statuses.length > 0,
  )
  const opportunities = visible
    ? (query.data?.pages.flatMap((page) => page.opportunities) ?? [])
    : []
  const groups = query.data?.pages[0]?.groups ?? []
  const totals = groups
    .filter((group) => group.key !== 'REJECTED')
    .reduce(
      (sum, group) => ({
        rental: sum.rental + group.rental,
        sale: sum.sale + group.sale,
        unclassified: sum.unclassified + group.unclassified,
      }),
      { rental: 0, sale: 0, unclassified: 0 },
    )
  const projectedTotals = [
    ...(totals.rental
      ? [{ label: '', labelKey: 'rent' as const, value: format.money(totals.rental, true) }]
      : []),
    ...(totals.sale
      ? [{ label: '', labelKey: 'sale' as const, value: format.money(totals.sale) }]
      : []),
    ...(totals.unclassified
      ? [
          {
            label: '',
            labelKey: 'uncategorized' as const,
            value: format.money(totals.unclassified),
          },
        ]
      : []),
  ]
  const propertiesById = new Map(
    opportunities.flatMap((item) =>
      item.property ? [[item.propertyId, item.property] as const] : [],
    ),
  )
  return (
    <>
      {query.isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => void query.refetch()}>{t('retry')}</Button>}
        >
          {t('dataLoadError')}
        </Alert>
      )}
      <PipelineStageColumn
        stage={stage}
        opportunities={opportunities}
        propertiesById={propertiesById}
        totalCount={visible ? (query.data?.pages[0]?.pagination.totalCount ?? 0) : 0}
        projectedTotals={visible ? projectedTotals : []}
        isPipelineLoading={sessionStatus === 'loading' || query.isLoading}
        hasPipelineError={query.isError}
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        onLoadMore={() => void query.fetchNextPage()}
      />
    </>
  )
}
