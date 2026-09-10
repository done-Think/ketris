'use client'

import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box } from '@mui/material'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { useSnackbar } from 'notistack'
import { useForm } from 'react-hook-form'

import { useRouter } from '@/i18n/navigation'

import {
  contractActionMockContents,
  contractMetrics,
  contractPeriodOptions,
} from '../config/contract-ui'
import {
  contractsFiltersDefaultValues,
  contractsFiltersSchema,
} from '../schemas/contracts-filters-schema'
import { useContractsStore } from '../stores/contracts-store'
import type {
  ContractActionDialogState,
  ContractListItem,
  ContractsFiltersFormValues,
  ContractTableAction,
} from '../types/contract'
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
  const { enqueueSnackbar } = useSnackbar()
  const [actionDialog, setActionDialog] = useState<ContractActionDialogState>({
    contract: null,
    action: null,
  })
  const contracts = useContractsStore((state) => state.contracts)
  const { control, setValue, watch } = useForm<ContractsFiltersFormValues>({
    defaultValues: contractsFiltersDefaultValues,
    resolver: zodResolver(contractsFiltersSchema),
  })
  const filters = watch()
  const filteredContracts = useMemo(
    () => contracts.filter((contract) => matchesContractsFilters(contract, filters)),
    [contracts, filters],
  )
  const createContract = () => router.push('/dashboard/contracts/new')
  const handleContractAction = (contract: ContractListItem, action: ContractTableAction) => {
    setActionDialog({ contract, action })
  }
  const openContractProperty = (contract: ContractListItem) => {
    router.push({ pathname: '/dashboard/properties/[id]', params: { id: contract.propertyId } })
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
    <Box sx={{ width: '100%', px: { xs: 2, md: 4, xl: 5.2 }, py: { xs: 2.4, md: 3.2 } }}>
      <Box
        sx={{
          width: '100%',
          minHeight: { md: 'calc(100vh - 68px)' },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ContractsDashboardHeader control={control} onCreateContract={createContract} />
        <ContractsFilters control={control} setValue={setValue} />
        <ContractsSummaryCards metrics={contractMetrics} />

        {filteredContracts.length > 0 ? (
          <ContractsTable
            contracts={filteredContracts}
            totalCount={contracts.length}
            onContractAction={handleContractAction}
            onContractSelect={openContractProperty}
          />
        ) : (
          <ContractsEmptyState onCreateContract={createContract} />
        )}

        <ContractActionDialog
          contract={actionDialog.contract}
          action={actionDialog.action}
          onClose={closeContractActionDialog}
          onConfirm={confirmContractAction}
        />
      </Box>
    </Box>
  )
}
