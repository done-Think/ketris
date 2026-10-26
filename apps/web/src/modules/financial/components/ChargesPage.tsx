'use client'

import { Box, Stack, Tab, Tabs } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { useRouter } from '@/i18n/navigation'
import { DashboardPageHeader } from '@shared/components/layout'

import { chargeDirections } from '../config/charge-status'
import {
  useCancelCharge,
  useCharges,
  useCreateCharge,
  useDeleteCharge,
  useUpdateCharge,
} from '../hooks/use-financial'
import { useChargesPageState } from '../hooks/use-charges-page-state'
import { useFinancialError } from '../hooks/use-financial-error'
import { styles } from '../styles/charges-page.styles'
import type { ChargeFormValues, ChargeListRow, ReasonFormValues } from '../types/charge'
import { mapChargeListItemFromApi, mapStatusCountsFromApi } from '../utils/charge-adapter'
import { ChargeFormDialog } from './ChargeFormDialog'
import { ChargeReasonDialog } from './ChargeReasonDialog'
import { ChargesHeaderActions } from './ChargesHeaderActions'
import { ChargesKpis } from './ChargesKpis'
import { ChargeStatusFilters } from './ChargeStatusFilters'
import { ChargesTable } from './ChargesTable'
import { DeleteChargeDialog } from './DeleteChargeDialog'

export function ChargesPage() {
  const t = useTranslations('charges')
  const { enqueueSnackbar } = useSnackbar()
  const errorMessage = useFinancialError()
  const router = useRouter()
  const { data: session } = useSession()
  const isOwner = session?.role === 'OWNER'
  const isRenter = session?.role === 'RENTER'
  const state = useChargesPageState(isRenter)
  const chargesQuery = useCharges(state.query)
  const createCharge = useCreateCharge()
  const updateCharge = useUpdateCharge()
  const cancelCharge = useCancelCharge()
  const deleteCharge = useDeleteCharge()
  const rows = (chargesQuery.data?.items ?? []).map(mapChargeListItemFromApi)
  const counts = chargesQuery.data
    ? mapStatusCountsFromApi(chargesQuery.data.statusCounts)
    : undefined
  const dialog = state.dialog
  const feedback = (successKey: string, fallbackKey: string) => ({
    onSuccess: () => {
      state.closeDialog()
      enqueueSnackbar(t(`feedback.${successKey}`), { variant: 'success' })
    },
    onError: (error: unknown) =>
      enqueueSnackbar(errorMessage(error, fallbackKey), { variant: 'error' }),
  })

  const submitForm = (values: ChargeFormValues) => {
    if (dialog?.kind === 'edit') {
      updateCharge.mutate({ charge: dialog.charge, values }, feedback('updated', 'updateFailed'))
      return
    }
    createCharge.mutate(values, {
      ...feedback('created', 'createFailed'),
      onSuccess: () => {
        state.closeDialog()
        state.setDirection(values.direction)
        enqueueSnackbar(t('feedback.created'), { variant: 'success' })
      },
    })
  }
  const submitCancel = (values: ReasonFormValues) => {
    if (dialog?.kind !== 'cancel') return
    cancelCharge.mutate(
      { chargeId: dialog.charge.id, values },
      feedback('cancelled', 'cancelFailed'),
    )
  }
  const confirmDelete = () => {
    if (dialog?.kind !== 'delete') return
    deleteCharge.mutate(dialog.charge.id, feedback('deleted', 'deleteFailed'))
  }
  const view = (charge: ChargeListRow) =>
    router.push({ pathname: '/dashboard/finance/charges/[id]', params: { id: charge.id } })

  return (
    <Box sx={styles.page}>
      <Stack spacing={{ xs: 2, md: 2.7 }}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={t(isRenter ? 'renter.subtitle' : 'subtitle')}
          sx={styles.header}
          actions={
            <ChargesHeaderActions
              search={state.filters.search}
              canCreate={isOwner}
              onSearchChange={state.setSearch}
              onCreate={() => state.openDialog({ kind: 'create' })}
            />
          }
        />
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={1.2}
          sx={styles.toolbar}
        >
          <ChargeStatusFilters
            value={state.filters.status}
            counts={counts}
            onChange={state.setStatus}
          />
          {isRenter ? null : (
            <Tabs
              value={state.filters.direction}
              onChange={(_, direction) => state.setDirection(direction)}
              sx={styles.tabs}
            >
              {chargeDirections.map((direction) => (
                <Tab key={direction} value={direction} label={t(`tabs.${direction}`)} />
              ))}
            </Tabs>
          )}
        </Stack>
        {isOwner ? <ChargesKpis /> : null}
        <ChargesTable
          rows={rows}
          readOnly={!isOwner}
          totalCount={chargesQuery.data?.totalCount ?? 0}
          page={state.filters.page}
          rowsPerPage={state.filters.rowsPerPage}
          onPageChange={state.setPage}
          onRowsPerPageChange={state.setRowsPerPage}
          onView={view}
          onEdit={(charge) => state.openDialog({ kind: 'edit', charge })}
          onCancel={(charge) => state.openDialog({ kind: 'cancel', charge })}
          onDelete={(charge) => state.openDialog({ kind: 'delete', charge })}
        />
      </Stack>
      {isOwner ? (
        <>
          <ChargeFormDialog
            open={dialog?.kind === 'create' || dialog?.kind === 'edit'}
            charge={dialog?.kind === 'edit' ? dialog.charge : null}
            pending={createCharge.isPending || updateCharge.isPending}
            onClose={state.closeDialog}
            onSubmit={submitForm}
          />
          <ChargeReasonDialog
            open={dialog?.kind === 'cancel'}
            kind="cancel"
            pending={cancelCharge.isPending}
            onClose={state.closeDialog}
            onSubmit={submitCancel}
          />
          <DeleteChargeDialog
            open={dialog?.kind === 'delete'}
            pending={deleteCharge.isPending}
            onClose={state.closeDialog}
            onConfirm={confirmDelete}
          />
        </>
      ) : null}
    </Box>
  )
}
