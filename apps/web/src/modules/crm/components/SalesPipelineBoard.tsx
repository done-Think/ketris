'use client'

import * as crmStyles from '../styles/sales-pipeline-board.styles'

import { useListState } from '@shared/hooks/use-list-state'
import { CrmProposalsList } from './CrmProposalsList'

import { Box } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useState } from 'react'

import { salesPipelineStages } from '../config/sales-pipeline-stages'
import { useCreateOpportunity } from '../hooks/use-opportunities'
import { usePipelineViewMode } from '../hooks/use-pipeline-view-mode'
import type { CreateOpportunityFormValues } from '../types/opportunity'
import type { SalesPipelineStageId } from '../types/sales-pipeline'
import { errorMessage } from '../utils/error-message'
import { CreateOpportunityDialog } from './opportunity-detail/CreateOpportunityDialog'
import { SalesPipelineToolbar } from './sales-pipeline-board/SalesPipelineToolbar'
import { SalesPipelineKanbanView } from './SalesPipelineKanbanView'

export function SalesPipelineBoard() {
  const t = useTranslations('crm.pipeline')
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const { filters: list, setFilter } = useListState({
    search: '',
    selectedStageId: null as SalesPipelineStageId | null,
  })
  const search = list.search
  const selectedStageId = list.selectedStageId
  const setSearch = (value: string) => setFilter('search', value)
  const setSelectedStageId = (value: SalesPipelineStageId | null) =>
    setFilter('selectedStageId', value)
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [viewMode, setViewMode] = usePipelineViewMode()
  const { enqueueSnackbar } = useSnackbar()

  const createOpportunity = useCreateOpportunity(tenantId)

  async function handleCreateOpportunity(values: CreateOpportunityFormValues) {
    try {
      await createOpportunity.mutateAsync({
        propertyId: values.property?.id ?? '',
        responsibleId: values.responsibleId || undefined,
        contactId: values.contact?.id,
        leadName: values.leadName.trim(),
        leadEmail: values.leadEmail.trim(),
        leadPhone: values.leadPhone.trim() || null,
        proposedValue: Number(values.proposedValue),
        notes: values.notes.trim() || null,
        contractTermMonths: values.contractTermMonths ? Number(values.contractTermMonths) : null,
        desiredStartDate: values.desiredStartDate || null,
        guaranteeType: values.guaranteeType,
        specialConditions: values.specialConditions.map(({ text }) => text.trim()),
        status: values.status,
      })
      enqueueSnackbar(t('createSuccess'), { variant: 'success' })
      setIsCreateOpen(false)
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('createError')), { variant: 'error' })
    }
  }

  const selectedStage = selectedStageId
    ? salesPipelineStages.find((stage) => stage.id === selectedStageId)
    : null

  return (
    <Box sx={crmStyles.getBoxSx(viewMode)}>
      <SalesPipelineToolbar
        search={search}
        selectedStage={selectedStage}
        selectedStageId={selectedStageId}
        filterAnchor={filterAnchor}
        viewMode={viewMode}
        onSearchChange={setSearch}
        onFilterOpen={setFilterAnchor}
        onFilterClose={() => setFilterAnchor(null)}
        onStageSelect={(stageId) => {
          setSelectedStageId(stageId)
          setFilterAnchor(null)
        }}
        onNewOpportunity={() => setIsCreateOpen(true)}
        onViewModeChange={setViewMode}
      />

      <CreateOpportunityDialog
        key={`${tenantId}:${session?.user?.id ?? ''}:${session?.role ?? ''}`}
        open={isCreateOpen}
        tenantId={tenantId}
        canChooseResponsible={session?.role === 'OWNER'}
        isPending={createOpportunity.isPending}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreateOpportunity}
      />

      {viewMode === 'kanban' ? (
        <SalesPipelineKanbanView
          tenantId={tenantId}
          search={search}
          selectedStageId={selectedStageId}
        />
      ) : (
        <CrmProposalsList embedded search={search} />
      )}
    </Box>
  )
}
