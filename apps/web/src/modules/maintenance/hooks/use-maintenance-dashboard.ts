'use client'

import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useListState } from '@shared/hooks/use-list-state'
import { useSession } from 'next-auth/react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import type {
  MaintenanceCreateTicketFormValues,
  MaintenanceFilter,
  MaintenanceMetric,
} from '../types/maintenance'
import type {
  MaintenanceDashboardDialog,
  MaintenanceDashboardFilters,
  MaintenanceDashboardMenu,
} from '../types/maintenance-dashboard'
import {
  buildUpdateMaintenanceTicketPayload,
  mapMaintenancePriorityToApi,
  mapMaintenanceStatusToApi,
  mapMaintenanceTicketListItemFromApi,
  mapMaintenanceTicketToFormValues,
} from '../utils/maintenance-adapter'
import {
  useCreateMaintenanceTicket,
  useDeleteMaintenanceTicket,
  useMaintenanceOptions,
  useMaintenanceTicket,
  useMaintenanceTickets,
  useUpdateMaintenanceTicket,
} from './use-maintenance'
import { useMaintenanceErrorMessage } from './use-maintenance-error-message'

const initialFilters: MaintenanceDashboardFilters = {
  activeFilter: 'all',
  search: '',
  propertyFilter: 'all',
  currentPage: 1,
  rowsPerPage: 5,
  archived: false,
}

export function useMaintenanceDashboard() {
  const errorMessage = useMaintenanceErrorMessage()
  const t = useTranslations('dashboard.maintenance')
  const formatter = useFormatter()
  const locale = useLocale()
  const { enqueueSnackbar } = useSnackbar()
  const { data: session } = useSession()
  const tenantId = session?.tenantId
  const { filters, setFilter } = useListState(initialFilters)
  const { activeFilter, propertyFilter, currentPage, rowsPerPage, archived } = filters
  const search = useDebouncedValue(filters.search, 300)
  const [dialog, openDialog] = useState<MaintenanceDashboardDialog>(null)
  const [menu, setMenu] = useState<MaintenanceDashboardMenu | null>(null)
  const editingTicketId = dialog?.kind === 'edit' ? dialog.ticketId : null
  const deletingTicketId = dialog?.kind === 'delete' ? dialog.ticketId : null
  const ticketsQuery = useMaintenanceTickets(tenantId, {
    archived,
    locale: locale === 'en-US' || locale === 'es-ES' ? locale : 'pt-BR',
    status:
      activeFilter !== 'all' && activeFilter !== 'urgent'
        ? mapMaintenanceStatusToApi(activeFilter)
        : undefined,
    priority: activeFilter === 'urgent' ? mapMaintenancePriorityToApi('urgent') : undefined,
    propertyId: propertyFilter === 'all' ? undefined : propertyFilter,
    search: search.trim() || undefined,
    page: currentPage,
    pageSize: rowsPerPage,
  })
  const optionsQuery = useMaintenanceOptions()
  const editTicketQuery = useMaintenanceTicket(tenantId, editingTicketId)
  const createMutation = useCreateMaintenanceTicket(tenantId)
  const updateMutation = useUpdateMaintenanceTicket(tenantId)
  const deleteMutation = useDeleteMaintenanceTicket(tenantId)
  const properties = [
    ...new Map(
      (optionsQuery.data?.contracts ?? []).map((contract) => [
        contract.propertyId,
        { id: contract.propertyId, title: contract.propertyTitle },
      ]),
    ).values(),
  ]
  const pagedTickets = (ticketsQuery.data?.items ?? []).map((item) =>
    mapMaintenanceTicketListItemFromApi(item, (value) =>
      formatter.dateTime(new Date(value), 'short'),
    ),
  )
  const summary = ticketsQuery.data?.summary
  const metrics: MaintenanceMetric[] = [
    { label: 'open', value: formatter.number(summary?.byStatus.ABERTO ?? 0) },
    { label: 'urgent', value: formatter.number(summary?.urgentCount ?? 0) },
  ]
  if (summary?.averageResolutionDays !== null && summary?.averageResolutionDays !== undefined)
    metrics.push({
      label: 'averageResolution',
      value: t('metrics.averageResolutionUnit', {
        days: formatter.number(summary.averageResolutionDays, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
      }),
    })
  const closeDialog = () => openDialog(null)
  const closeMenu = () => setMenu(null)
  function changeFilter<Key extends keyof MaintenanceDashboardFilters>(
    key: Key,
    value: MaintenanceDashboardFilters[Key],
  ) {
    setFilter(key, value)
    setFilter('currentPage', 1)
  }
  function getFilterCount(value: MaintenanceFilter['value']) {
    if (value === 'all') return summary?.totalCount ?? 0
    if (value === 'urgent') return summary?.urgentCount ?? 0
    return summary?.byStatus[mapMaintenanceStatusToApi(value)] ?? 0
  }
  async function handleCreateTicket(values: MaintenanceCreateTicketFormValues) {
    try {
      await createMutation.mutateAsync(values)
      enqueueSnackbar(t('notifications.createSuccess'), { variant: 'success' })
      setFilter('currentPage', 1)
      closeDialog()
      return true
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.createError')), { variant: 'error' })
      return false
    }
  }
  async function handleSaveTicket(values: MaintenanceCreateTicketFormValues) {
    if (!editingTicketId) return false
    try {
      await updateMutation.mutateAsync({
        id: editingTicketId,
        payload: buildUpdateMaintenanceTicketPayload(values),
      })
      enqueueSnackbar(t('notifications.updateSuccess'), { variant: 'success' })
      closeDialog()
      return true
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.updateError')), { variant: 'error' })
      return false
    }
  }
  async function handleDeleteTicket() {
    if (!deletingTicketId || deleteMutation.isPending) return
    try {
      await deleteMutation.mutateAsync(deletingTicketId)
      enqueueSnackbar(t('notifications.deleteSuccess'), { variant: 'success' })
      closeDialog()
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.deleteError')), { variant: 'error' })
    }
  }
  return {
    ...filters,
    t,
    session,
    properties,
    pagedTickets,
    metrics,
    getFilterCount,
    currentPage: ticketsQuery.data?.pagination?.page ?? currentPage,
    totalCount: ticketsQuery.data?.totalCount ?? 0,
    isLoading: ticketsQuery.isLoading,
    isError: ticketsQuery.isError,
    retry: ticketsQuery.refetch,
    editingTicketId,
    deletingTicketId,
    menuAnchor: menu?.anchor ?? null,
    menuTicketId: menu?.ticketId ?? null,
    isCreateDialogOpen: dialog?.kind === 'create' || dialog?.kind === 'edit',
    isFiltersDialogOpen: dialog?.kind === 'filters',
    linksOpen: dialog?.kind === 'links',
    providersOpen: dialog?.kind === 'providers',
    initialValues:
      editingTicketId && editTicketQuery.data
        ? mapMaintenanceTicketToFormValues(editTicketQuery.data)
        : undefined,
    isEditLoading: editTicketQuery.isLoading,
    isEditError: editTicketQuery.isError,
    retryEdit: editTicketQuery.refetch,
    isDeleting: deleteMutation.isPending,
    setCurrentPage: (page: number) => setFilter('currentPage', page),
    setRowsPerPage: (rows: number) => changeFilter('rowsPerPage', rows),
    setSearch: (value: string) => changeFilter('search', value),
    setArchived: (value: boolean) => changeFilter('archived', value),
    handleActiveFilterChange: (value: MaintenanceFilter['value']) =>
      changeFilter('activeFilter', value),
    handlePropertyFilterChange: (value: string) => changeFilter('propertyFilter', value),
    openDialog,
    closeDialog,
    closeMenu,
    openMenu: (anchor: HTMLElement, ticketId: string) => setMenu({ anchor, ticketId }),
    handleCreateTicket,
    handleSaveTicket,
    handleDeleteTicket,
  }
}
