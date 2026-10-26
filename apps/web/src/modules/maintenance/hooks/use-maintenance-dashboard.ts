'use client'

import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import {
  useCreateMaintenanceTicket,
  useDeleteMaintenanceTicket,
  useMaintenanceTicket,
  useMaintenanceTickets,
  useUpdateMaintenanceTicket,
  useMaintenanceOptions,
} from './use-maintenance'
import { useListState } from '@shared/hooks/use-list-state'

import type {
  MaintenanceCreateTicketFormValues,
  MaintenanceDashboardDialog,
  MaintenanceDashboardFilters,
  MaintenanceFilter,
  MaintenanceMetric,
  MaintenanceTicketMenu,
} from '../types/maintenance'
import {
  buildUpdateMaintenanceTicketPayload,
  mapMaintenancePriorityToApi,
  mapMaintenanceStatusToApi,
  mapMaintenanceTicketListItemFromApi,
  mapMaintenanceTicketToFormValues,
} from '../utils/maintenance-adapter'
import { errorMessage } from '../utils/error-message'

const initialFilters: MaintenanceDashboardFilters = {
  status: 'all',
  search: '',
  propertyId: 'all',
  category: 'all',
  archived: false,
  page: 1,
  rowsPerPage: 5,
}

export function useMaintenanceDashboard() {
  const t = useTranslations('dashboard.maintenance')

  const { enqueueSnackbar } = useSnackbar()

  const { data: session } = useSession()

  const tenantId = session?.tenantId

  const { filters, setFilter } = useListState(initialFilters)

  const [dialog, setDialog] = useState<MaintenanceDashboardDialog | null>(null)

  const [menu, setMenu] = useState<MaintenanceTicketMenu | null>(null)

  const editingTicketId = dialog?.kind === 'edit' ? dialog.ticketId : null

  // Every filter change starts again from the first page.
  function setFilterFromStart<TKey extends keyof MaintenanceDashboardFilters>(
    key: TKey,
    value: MaintenanceDashboardFilters[TKey],
  ) {
    setFilter(key, value)
    setFilter('page', 1)
  }

  const ticketsQuery = useMaintenanceTickets(tenantId, {
    archived: filters.archived,
    status:
      filters.status !== 'all' && filters.status !== 'urgent'
        ? mapMaintenanceStatusToApi(filters.status)
        : undefined,
    priority: filters.status === 'urgent' ? mapMaintenancePriorityToApi('urgent') : undefined,
    category: filters.category === 'all' ? undefined : filters.category,
    propertyId: filters.propertyId === 'all' ? undefined : filters.propertyId,
    search: filters.search.trim() || undefined,
    page: filters.page,
    pageSize: filters.rowsPerPage,
  })

  const allTicketsQuery = useMaintenanceTickets(tenantId, {
    pageSize: 100,
    archived: filters.archived,
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

  const pagedTickets = useMemo(
    () => (ticketsQuery.data?.items ?? []).map(mapMaintenanceTicketListItemFromApi),
    [ticketsQuery.data],
  )

  const allTickets = useMemo(
    () => (allTicketsQuery.data?.items ?? []).map(mapMaintenanceTicketListItemFromApi),
    [allTicketsQuery.data],
  )

  const totalCount = ticketsQuery.data?.totalCount ?? 0

  const metrics = useMemo<MaintenanceMetric[]>(() => {
    const openCount = allTickets.filter((ticket) => ticket.status === 'open').length
    const urgentCount = allTickets.filter((ticket) => ticket.priority === 'urgent').length
    const resolvedItems = (allTicketsQuery.data?.items ?? []).filter((item) => item.resolvedAt)
    const averageResolutionDays =
      resolvedItems.length > 0
        ? resolvedItems.reduce(
            (total, item) =>
              total + dayjs(item.resolvedAt).diff(dayjs(item.createdAt), 'day', true),
            0,
          ) / resolvedItems.length
        : null

    const result: MaintenanceMetric[] = [
      { label: 'open', value: String(openCount) },
      { label: 'urgent', value: String(urgentCount) },
    ]

    if (averageResolutionDays !== null) {
      result.push({
        label: 'averageResolution',
        value: t('metrics.averageResolutionUnit', { days: averageResolutionDays.toFixed(1) }),
      })
    }

    return result
  }, [t, allTicketsQuery.data, allTickets])

  function getFilterCount(value: MaintenanceFilter['value']) {
    return allTickets.filter(
      (ticket) =>
        value === 'all' ||
        (value === 'urgent' ? ticket.priority === 'urgent' : ticket.status === value),
    ).length
  }

  async function handleCreateTicket(values: MaintenanceCreateTicketFormValues) {
    try {
      await createMutation.mutateAsync(values)
      enqueueSnackbar(t('notifications.createSuccess'), { variant: 'success' })
      setFilter('page', 1)
      setDialog(null)
      return true
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.createError')), { variant: 'error' })
      return false
    }
  }

  const initialValues =
    editingTicketId && editTicketQuery.data
      ? mapMaintenanceTicketToFormValues(editTicketQuery.data)
      : undefined

  async function handleSaveTicket(values: MaintenanceCreateTicketFormValues) {
    if (!editingTicketId) return
    try {
      await updateMutation.mutateAsync({
        id: editingTicketId,
        payload: buildUpdateMaintenanceTicketPayload(values),
      })
      enqueueSnackbar(t('notifications.updateSuccess'), { variant: 'success' })
      setDialog(null)
      return true
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.updateError')), { variant: 'error' })
      return false
    }
  }

  async function handleDeleteTicket() {
    if (dialog?.kind !== 'delete') return
    try {
      await deleteMutation.mutateAsync(dialog.ticketId)
      enqueueSnackbar(t('notifications.deleteSuccess'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.deleteError')), { variant: 'error' })
    } finally {
      setDialog(null)
    }
  }
  return {
    t,
    session,
    filters,
    setSearch: (value: string) => setFilterFromStart('search', value),
    setActiveFilter: (value: MaintenanceFilter['value']) => setFilterFromStart('status', value),
    setPropertyFilter: (value: string) => setFilterFromStart('propertyId', value),
    setCategoryFilter: (value: MaintenanceDashboardFilters['category']) =>
      setFilterFromStart('category', value),
    setArchived: (value: boolean) => setFilterFromStart('archived', value),
    setRowsPerPage: (value: number) => setFilterFromStart('rowsPerPage', value),
    setCurrentPage: (value: number) => setFilter('page', value),
    dialog,
    openDialog: setDialog,
    closeDialog: () => setDialog(null),
    menu,
    openMenu: (anchor: HTMLElement, ticketId: string) => setMenu({ anchor, ticketId }),
    closeMenu: () => setMenu(null),
    editingTicketId,
    properties,
    pagedTickets,
    totalCount,
    metrics,
    getFilterCount,
    handleCreateTicket,
    initialValues,
    handleSaveTicket,
    handleDeleteTicket,
  }
}
