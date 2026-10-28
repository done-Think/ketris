'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, Stack } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { useForm, useWatch } from 'react-hook-form'
import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useRouter } from '@/i18n/navigation'
import { styles } from '../styles/contracts-dashboard-page.styles'
import {
  contractsFiltersDefaultValues,
  contractsFiltersSchema,
} from '../schemas/contracts-filters-schema'
import { useContracts } from '../hooks/use-contracts'
import { useContractPresentation } from '../hooks/use-contract-presentation'
import type {
  ContractListItem,
  ContractMetric,
  ContractsFiltersFormValues,
  ContractTableAction,
} from '../types/contract'
import { mapContractListItemFromApi } from '../utils/contract-adapter'
import { useContractTableState } from '../hooks/use-contract-table-state'
import { ContractsDashboardHeader } from './ContractsDashboardHeader'
import { ContractsFilters } from './ContractsFilters'
import { ContractsSummaryCards } from './ContractsSummaryCards'
import { ContractsTable } from './ContractsTable'

export function ContractsDashboardPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('contracts.detail')
  const { data: session } = useSession()
  const readOnly = session?.role !== 'OWNER' && session?.role !== 'AGENT'
  const presentation = useContractPresentation()
  const { control, setValue } = useForm<ContractsFiltersFormValues>({
    defaultValues: contractsFiltersDefaultValues,
    resolver: zodResolver(contractsFiltersSchema),
  })
  const [searchQuery, status, type, period] = useWatch({
    control,
    name: ['searchQuery', 'status', 'type', 'period'],
  })
  const debouncedSearch = useDebouncedValue(searchQuery)
  const table = useContractTableState(
    { searchQuery: debouncedSearch, status, type, period },
    locale,
  )
  const { model, filters } = table
  const query = useContracts({
    ...filters,
    page: model.page + 1,
    pageSize: model.pageSize,
  })
  const contracts = (query.data?.items ?? []).map((item) =>
    mapContractListItemFromApi(item, presentation),
  )
  const summary = query.data?.summary
  const metrics: ContractMetric[] = [
    { label: 'active', value: String(summary?.active ?? 0), caption: '', tone: 'success' },
    {
      label: 'expiring30',
      value: String(summary?.expiring30 ?? 0),
      caption: '',
      tone: 'warning',
    },
    { label: 'total', value: String(summary?.total ?? 0), caption: '', tone: 'primary' },
  ]
  const open = (contract: ContractListItem, action: ContractTableAction = 'view-summary') => {
    router.push({
      pathname: '/dashboard/contracts/[id]',
      params: { id: contract.id },
      ...(action === 'edit-data' ? { query: { edit: '1' } } : {}),
      ...(action === 'view-history'
        ? { hash: 'history' }
        : action === 'view-documents'
          ? { hash: 'documents' }
          : {}),
    })
  }
  return (
    <Box sx={styles.box}>
      <Stack spacing={2} sx={styles.stack}>
        <ContractsDashboardHeader
          control={control}
          onCreateContract={readOnly ? undefined : () => router.push('/dashboard/contracts/new')}
        />
        <ContractsFilters
          control={control}
          setValue={setValue}
          filterCounts={{
            ALL: summary?.total ?? 0,
            active: summary?.active ?? 0,
            expiring90: summary?.expiring90 ?? 0,
            closed: summary?.closed ?? 0,
          }}
        />
        <ContractsSummaryCards metrics={metrics} />
        {query.isError && (
          <Alert
            severity="error"
            action={<Button onClick={() => query.refetch()}>{t('retry')}</Button>}
          >
            {t('loadError')}
          </Alert>
        )}
        <ContractsTable
          contracts={contracts}
          totalCount={query.data?.totalCount ?? 0}
          loading={query.isFetching}
          onContractAction={open}
          onContractSelect={(contract) => open(contract)}
          readOnly={readOnly}
          paginationModel={model}
          onPaginationModelChange={table.onPagination}
          sortModel={table.sort}
          onSortModelChange={table.onSort}
        />
      </Stack>
    </Box>
  )
}
