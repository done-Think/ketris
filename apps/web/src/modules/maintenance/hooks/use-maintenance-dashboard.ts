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
import type {
  MaintenanceCreateTicketFormValues,
  MaintenanceFilter,
  MaintenanceMetric,
  MaintenanceStatus,
} from '../types/maintenance'
import {
  buildUpdateMaintenanceTicketPayload,
  mapMaintenancePriorityToApi,
  mapMaintenanceStatusToApi,
  mapMaintenanceTicketListItemFromApi,
  mapMaintenanceTicketToFormValues,
} from '../utils/maintenance-adapter'
import type { ApiMaintenanceTicketCategory } from '../types/service'
import { errorMessage } from '../utils/error-message'

const ticketsPerPage = 5

export function useMaintenanceDashboard() {
  const t = useTranslations('dashboard.maintenance')

  const { enqueueSnackbar } = useSnackbar()

  const { data: session } = useSession()

  const tenantId = session?.tenantId

  const [activeFilter, setActiveFilter] = useState<'all' | MaintenanceStatus | 'urgent'>('all')

  const [search, setSearch] = useState('')

  const [propertyFilter, setPropertyFilter] = useState('all')

  const [categoryFilter, setCategoryFilter] = useState<ApiMaintenanceTicketCategory | 'all'>('all')

  const [currentPage, setCurrentPage] = useState(1)

  const [rowsPerPage, setRowsPerPage] = useState(ticketsPerPage)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false)

  const [editingTicketId, setEditingTicketId] = useState<string | null>(null)

  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null)

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  const [menuTicketId, setMenuTicketId] = useState<string | null>(null)

  const [archived, setArchived] = useState(false)

  const [linksOpen, setLinksOpen] = useState(false)

  const ticketsQuery = useMaintenanceTickets(tenantId, {
    archived,
    status:
      activeFilter !== 'all' && activeFilter !== 'urgent'
        ? mapMaintenanceStatusToApi(activeFilter)
        : undefined,
    priority: activeFilter === 'urgent' ? mapMaintenancePriorityToApi('urgent') : undefined,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    propertyId: propertyFilter === 'all' ? undefined : propertyFilter,
    search: search.trim() || undefined,
    page: currentPage,
    pageSize: rowsPerPage,
  })

  const allTicketsQuery = useMaintenanceTickets(tenantId, { pageSize: 100, archived })

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

  function handleActiveFilterChange(value: MaintenanceFilter['value']) {
    setActiveFilter(value)
    setCurrentPage(1)
  }

  function handlePropertyFilterChange(value: string) {
    setPropertyFilter(value)
    setCurrentPage(1)
  }

  function handleCategoryFilterChange(value: ApiMaintenanceTicketCategory | 'all') {
    setCategoryFilter(value)
    setCurrentPage(1)
  }

  async function handleCreateTicket(values: MaintenanceCreateTicketFormValues) {
    try {
      await createMutation.mutateAsync(values)
      enqueueSnackbar(t('notifications.createSuccess'), { variant: 'success' })
      setCurrentPage(1)
      setIsCreateDialogOpen(false)
      return true
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.createError')), { variant: 'error' })
      return false
    }
  }

  function closeMenu() {
    setMenuAnchor(null)
    setMenuTicketId(null)
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
      setEditingTicketId(null)
      setIsCreateDialogOpen(false)
      return true
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.updateError')), { variant: 'error' })
      return false
    }
  }

  async function handleDeleteTicket() {
    if (!deletingTicketId) return
    try {
      await deleteMutation.mutateAsync(deletingTicketId)
      enqueueSnackbar(t('notifications.deleteSuccess'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.deleteError')), { variant: 'error' })
    } finally {
      setDeletingTicketId(null)
    }
  }
  return {
    t,
    session,
    activeFilter,
    search,
    setSearch,
    propertyFilter,
    categoryFilter,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isFiltersDialogOpen,
    setIsFiltersDialogOpen,
    editingTicketId,
    setEditingTicketId,
    deletingTicketId,
    setDeletingTicketId,
    menuAnchor,
    setMenuAnchor,
    menuTicketId,
    setMenuTicketId,
    archived,
    setArchived,
    linksOpen,
    setLinksOpen,
    properties,
    pagedTickets,
    totalCount,
    metrics,
    getFilterCount,
    handleActiveFilterChange,
    handlePropertyFilterChange,
    handleCategoryFilterChange,
    handleCreateTicket,
    closeMenu,
    initialValues,
    handleSaveTicket,
    handleDeleteTicket,
  }
}
