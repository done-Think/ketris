'use client'

import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Stack } from '@mui/material'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { useSession } from 'next-auth/react'
import { useSnackbar } from 'notistack'
import { useForm, useWatch } from 'react-hook-form'

import { useRouter } from '@/i18n/navigation'

import {
  contractActionMockContents,
  contractFilterTabs,
  contractPeriodOptions,
} from '../config/contract-ui'
import {
  contractsFiltersDefaultValues,
  contractsFiltersSchema,
} from '../schemas/contracts-filters-schema'
import { useContracts } from '../hooks/use-contracts'
import type {
  ContractActionDialogState,
  ContractListItem,
  ContractMetric,
  ContractsFiltersFormValues,
  ContractTableAction,
} from '../types/contract'
import { mapContractListItemFromApi } from '../utils/contract-adapter'
import { ContractActionDialog } from './ContractActionDialog'
import { ContractsDashboardHeader } from './ContractsDashboardHeader'
import { ContractsEmptyState } from './ContractsEmptyState'
import { ContractsFilters } from './ContractsFilters'
import { ContractsSummaryCards } from './ContractsSummaryCards'
import { ContractsTable } from './ContractsTable'

dayjs.extend(customParseFormat)

function matchesSearchQuery(contract: ContractListItem, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
  if (!normalizedQuery) return true

  return [
    contract.code,
    contract.title,
    contract.property,
    contract.propertyAddress,
    contract.owner,
    contract.tenant,
    contract.amount,
  ].some((value) => value.toLocaleLowerCase('pt-BR').includes(normalizedQuery))
}

function matchesPeriodFilter(
  contract: ContractListItem,
  period: ContractsFiltersFormValues['period'],
) {
  if (period === contractPeriodOptions[0]) return true

  const today = dayjs().startOf('day')
  const endDate = dayjs(contract.endDate, 'DD/MM/YYYY').startOf('day')

  if (!endDate.isValid() || endDate.isBefore(today)) return false

  if (period === 'Vencem este mês') {
    return endDate.isSame(today, 'month') && endDate.isSame(today, 'year')
  }

  return endDate.isBefore(today.add(90, 'day').add(1, 'day'))
}

function matchesContractsFilters(contract: ContractListItem, filters: ContractsFiltersFormValues) {
  const matchesStatus = filters.status === 'Todos' || contract.status === filters.status
  const matchesType = filters.type === 'Todos' || contract.type === filters.type

  return (
    matchesStatus &&
    matchesType &&
    matchesSearchQuery(contract, filters.searchQuery) &&
    matchesPeriodFilter(contract, filters.period)
  )
}

export function ContractsDashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const { enqueueSnackbar } = useSnackbar()
  const [actionDialog, setActionDialog] = useState<ContractActionDialogState>({
    contract: null,
    action: null,
  })
  const contractsQuery = useContracts(tenantId, { pageSize: 500 })
  const contracts = useMemo(
    () => (contractsQuery.data?.items ?? []).map(mapContractListItemFromApi),
    [contractsQuery.data],
  )
  const { control, setValue } = useForm<ContractsFiltersFormValues>({
    defaultValues: contractsFiltersDefaultValues,
    resolver: zodResolver(contractsFiltersSchema),
  })
  const searchQuery = useWatch({ control, name: 'searchQuery' })
  const status = useWatch({ control, name: 'status' })
  const type = useWatch({ control, name: 'type' })
  const period = useWatch({ control, name: 'period' })
  const filteredContracts = useMemo(
    () =>
      contracts.filter((contract) =>
        matchesContractsFilters(contract, { searchQuery, status, type, period }),
      ),
    [contracts, searchQuery, status, type, period],
  )
  const filterCounts = useMemo(
    () =>
      contractFilterTabs.reduce(
        (counts, tab) => ({
          ...counts,
          [tab.label]: contracts.filter(
            (contract) =>
              (tab.status === 'Todos' || contract.status === tab.status) &&
              matchesPeriodFilter(contract, tab.period),
          ).length,
        }),
        {} as Record<(typeof contractFilterTabs)[number]['label'], number>,
      ),
    [contracts],
  )
  const summaryMetrics = useMemo<ContractMetric[]>(() => {
    const activeCount = contracts.filter((contract) => contract.status === 'Ativo').length
    const expiringCount = contracts.filter((contract) =>
      matchesPeriodFilter(contract, 'Vencem em 90 dias'),
    ).length

    return [
      { label: 'Ativos', value: String(activeCount), caption: '', tone: 'success' },
      { label: 'Vencendo em 30d', value: String(expiringCount), caption: '', tone: 'warning' },
      { label: 'Total', value: String(contracts.length), caption: '', tone: 'primary' },
    ]
  }, [contracts])
  const createContract = () => router.push('/dashboard/contracts/new')
  const openContractDetail = (contract: ContractListItem) => {
    router.push({ pathname: '/dashboard/contracts/[id]', params: { id: contract.id } })
  }
  const handleContractAction = (contract: ContractListItem, action: ContractTableAction) => {
    if (action === 'view-summary') {
      openContractDetail(contract)
      return
    }

    setActionDialog({ contract, action })
  }
  const closeContractActionDialog = () => {
    setActionDialog({ contract: null, action: null })
  }
  const confirmContractAction = () => {
    if (!actionDialog.contract || !actionDialog.action) return

    const content = contractActionMockContents[actionDialog.action]

    enqueueSnackbar(`${actionDialog.contract.code}: ${content.successMessage}`, {
      variant: 'info',
    })
    closeContractActionDialog()
  }

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack
        spacing={2}
        sx={{
          width: '100%',
          minHeight: { md: 'calc(100vh - 68px)' },
        }}
      >
        <ContractsDashboardHeader control={control} onCreateContract={createContract} />
        <ContractsFilters control={control} filterCounts={filterCounts} setValue={setValue} />
        <ContractsSummaryCards metrics={summaryMetrics} />

        {!contractsQuery.isLoading && filteredContracts.length > 0 ? (
          <ContractsTable
            contracts={filteredContracts}
            totalCount={contracts.length}
            onContractAction={handleContractAction}
            onContractSelect={openContractDetail}
          />
        ) : !contractsQuery.isLoading ? (
          <ContractsEmptyState onCreateContract={createContract} />
        ) : null}

        <ContractActionDialog
          contract={actionDialog.contract}
          action={actionDialog.action}
          onClose={closeContractActionDialog}
          onConfirm={confirmContractAction}
        />
      </Stack>
    </Box>
  )
}
