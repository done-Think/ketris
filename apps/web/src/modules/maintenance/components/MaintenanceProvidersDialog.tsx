'use client'

import * as maintenanceStyles from '../styles/maintenance-providers-dialog.styles'

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useListState } from '@shared/hooks/use-list-state'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { useMaintenanceErrorMessage } from '../hooks/use-maintenance-error-message'
import {
  useCreateMaintenanceProvider,
  useMaintenanceProviders,
  useUpdateMaintenanceProvider,
} from '../hooks/use-maintenance-providers'
import type {
  MaintenanceProviderEditor,
  MaintenanceProviderFormValues,
  MaintenanceProviderOption,
  MaintenanceProvidersDialogProps,
} from '../types/maintenance-provider'
import { MaintenanceProviderForm } from './MaintenanceProviderForm'

export function MaintenanceProvidersDialog(props: MaintenanceProvidersDialogProps) {
  return props.open ? <MaintenanceProvidersList {...props} /> : null
}

function MaintenanceProvidersList({ onClose }: MaintenanceProvidersDialogProps) {
  const errorMessage = useMaintenanceErrorMessage()
  const t = useTranslations('dashboard.maintenance.providers')
  const { enqueueSnackbar } = useSnackbar()
  const { filters, setFilter } = useListState({ search: '', page: 1, includeInactive: false })
  const [editor, setEditor] = useState<MaintenanceProviderEditor>(null)
  const search = useDebouncedValue(filters.search, 300)
  const query = useMaintenanceProviders({
    ...filters,
    search: search.trim() || undefined,
    pageSize: 5,
  })
  const create = useCreateMaintenanceProvider()
  const update = useUpdateMaintenanceProvider()
  async function save(values: MaintenanceProviderFormValues) {
    const provider = {
      ...values,
      phone: values.phone || null,
      email: values.email || null,
      notes: values.notes || null,
    }
    try {
      if (editor?.kind === 'edit')
        await update.mutateAsync({ id: editor.provider.id, payload: provider })
      else await create.mutateAsync({ provider })
      enqueueSnackbar(t('success'), { variant: 'success' })
      setEditor(null)
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('error')), { variant: 'error' })
    }
  }
  async function toggleActive(provider: MaintenanceProviderOption) {
    try {
      await update.mutateAsync({ id: provider.id, payload: { active: !provider.active } })
      enqueueSnackbar(t('success'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('error')), { variant: 'error' })
    }
  }
  return (
    <>
      <Dialog open onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
              <TextField
                label={t('search')}
                value={filters.search}
                onChange={(event) => {
                  setFilter('search', event.target.value)
                  setFilter('page', 1)
                }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.includeInactive}
                    onChange={(_event, checked) => {
                      setFilter('includeInactive', checked)
                      setFilter('page', 1)
                    }}
                  />
                }
                label={t('includeInactive')}
              />
              <Button variant="contained" onClick={() => setEditor({ kind: 'create' })}>
                {t('createTitle')}
              </Button>
            </Stack>
            {query.isLoading && <CircularProgress aria-label={t('loading')} />}
            {query.isError && (
              <Alert
                severity="error"
                action={<Button onClick={() => query.refetch()}>{t('retry')}</Button>}
              >
                {t('loadError')}
              </Alert>
            )}
            {!query.isLoading && !query.isError && query.data?.items.length === 0 && (
              <Typography>{t('empty')}</Typography>
            )}
            {query.data?.items.map((provider) => (
              <Box key={provider.id} sx={maintenanceStyles.boxSx}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  gap={1}
                >
                  <Stack>
                    <Typography fontWeight={700}>
                      {provider.name} {!provider.active && t('inactive')}
                    </Typography>
                    <Typography>{provider.phone}</Typography>
                    <Typography>{provider.email}</Typography>
                    <Typography sx={maintenanceStyles.typographySx}>{provider.notes}</Typography>
                  </Stack>
                  <Stack direction="row" gap={1} alignItems="center">
                    <Button onClick={() => setEditor({ kind: 'edit', provider })}>
                      {t('edit')}
                    </Button>
                    <Button disabled={update.isPending} onClick={() => toggleActive(provider)}>
                      {provider.active ? t('inactivate') : t('reactivate')}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ))}
            <TablePagination
              component="div"
              count={query.data?.totalCount ?? 0}
              page={(query.data?.page ?? filters.page) - 1}
              rowsPerPage={5}
              rowsPerPageOptions={[5]}
              onPageChange={(_event, page) => setFilter('page', page + 1)}
              getItemAriaLabel={(type) => t(`${type}Page`)}
              labelDisplayedRows={({ from, to, count }) => t('pagination', { from, to, count })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('close')}</Button>
        </DialogActions>
      </Dialog>
      {editor && (
        <MaintenanceProviderForm
          key={editor.kind === 'edit' ? editor.provider.id : 'new'}
          provider={editor.kind === 'edit' ? editor.provider : undefined}
          isPending={create.isPending || update.isPending}
          onClose={() => setEditor(null)}
          onSubmit={save}
        />
      )}
    </>
  )
}
