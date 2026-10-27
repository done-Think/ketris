'use client'

import * as maintenanceStyles from '../styles/maintenance-create-ticket-dialog.styles'

import { zodResolver } from '@hookform/resolvers/zod'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  maintenanceCategories,
  maintenanceCategoryKeys,
} from '@shared/lib/utils/maintenance-categories'

import { RhfTextField } from '@shared/components/form'

import { useMaintenanceOptions } from '../hooks/use-maintenance'
import {
  maintenanceDraftKey,
  parseMaintenanceDraft,
  readMaintenanceDraft,
  writeMaintenanceDraft,
} from '../utils/maintenance-draft'

import { createMaintenanceTicketSchema } from '../schemas/maintenance-ticket-schema'
import type {
  MaintenanceCreateTicketDialogProps,
  MaintenanceCreateTicketFormValues,
  MaintenanceTicketFormValues,
} from '../types/maintenance'

const defaultValues: MaintenanceTicketFormValues = {
  contractId: '',
  category: '',
  priority: 'normal',
  title: '',
  description: '',
}

export function MaintenanceCreateTicketDialog(props: MaintenanceCreateTicketDialogProps) {
  const t = useTranslations('dashboard.maintenance.createDialog')
  if (!props.open) return null
  if (props.mode === 'edit' && !props.initialValues)
    return (
      <Dialog open onClose={props.onClose} fullWidth maxWidth="sm">
        <DialogContent>
          {props.loadError ? (
            <Alert severity="error" action={<Button onClick={props.onRetry}>{t('retry')}</Button>}>
              {t('loadError')}
            </Alert>
          ) : (
            <CircularProgress aria-label={t('loading')} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose}>{t('cancel')}</Button>
        </DialogActions>
      </Dialog>
    )
  return <MaintenanceCreateTicketForm {...props} />
}

function MaintenanceCreateTicketForm({
  open,
  onClose,
  onCreate,
  initialValues,
  mode = 'create',
}: MaintenanceCreateTicketDialogProps) {
  const t = useTranslations('dashboard.maintenance.createDialog')
  const maintenanceT = useTranslations('dashboard.maintenance')
  const { data: options } = useMaintenanceOptions()
  const { data: session } = useSession()
  const draftKey = maintenanceDraftKey(session?.tenantId, session?.user?.id)
  const [discardOpen, setDiscardOpen] = useState(false)
  const maintenanceTicketSchema = useMemo(
    () => createMaintenanceTicketSchema((key) => t(`errors.${key}`)),
    [t],
  )
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting: submitting },
  } = useForm<MaintenanceTicketFormValues>({
    defaultValues:
      parseMaintenanceDraft(
        initialValues ?? (mode === 'create' ? readMaintenanceDraft(draftKey) : null),
      ) ?? defaultValues,
    resolver: zodResolver(maintenanceTicketSchema),
  })
  useEffect(() => {
    if (!open || mode !== 'create') return
    const subscription = watch((values) =>
      writeMaintenanceDraft(draftKey, parseMaintenanceDraft(values)),
    )
    return () => subscription.unsubscribe()
  }, [draftKey, mode, open, watch])

  function handleClose() {
    if (submitting) return
    onClose()
  }

  async function handleCreate(values: MaintenanceTicketFormValues) {
    if (submitting) return
    const ticket: MaintenanceCreateTicketFormValues = {
      ...values,
      ...maintenanceTicketSchema.parse(values),
    }
    const result = await onCreate(ticket)
    if (result !== false) {
      reset(defaultValues)
      if (mode === 'create') writeMaintenanceDraft(draftKey, null)
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: maintenanceStyles.extraStyleSx1,
          },
        }}
      >
        <Box component="form" noValidate onSubmit={handleSubmit(handleCreate)}>
          <DialogTitle sx={maintenanceStyles.dialogTitleSx}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Typography sx={maintenanceStyles.typographySx}>
                {mode === 'edit' ? t('editTitle') : t('title')}
              </Typography>
              <IconButton aria-label={t('close')} onClick={handleClose}>
                <CloseRoundedIcon sx={maintenanceStyles.closeRoundedIconSx} />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent sx={maintenanceStyles.dialogContentSx}>
            <Box sx={maintenanceStyles.boxSx}>
              <RhfTextField
                control={control}
                name="contractId"
                disabled={mode === 'edit' && session?.role === 'RENTER'}
                label={t('fields.contract')}
                select
                fullWidth
                autoFocus
              >
                {mode === 'edit' &&
                  initialValues?.contractId &&
                  !options?.contracts.some(
                    (contract) => contract.id === initialValues.contractId,
                  ) && <MenuItem value={initialValues.contractId}>{t('currentContract')}</MenuItem>}
                {(options?.contracts ?? []).map((contract) => (
                  <MenuItem key={contract.id} value={contract.id}>
                    {contract.code} - {contract.propertyTitle}
                  </MenuItem>
                ))}
              </RhfTextField>
              <RhfTextField
                control={control}
                name="category"
                label={t('fields.category')}
                select
                fullWidth
              >
                {maintenanceCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {maintenanceT(`categories.${maintenanceCategoryKeys[category]}`)}
                  </MenuItem>
                ))}
              </RhfTextField>
              <RhfTextField
                control={control}
                name="priority"
                label={t('fields.priority')}
                select
                fullWidth
              >
                <MenuItem value="normal">{maintenanceT('priorities.normal')}</MenuItem>
                <MenuItem value="high">{maintenanceT('priorities.high')}</MenuItem>
                <MenuItem value="urgent">{maintenanceT('priorities.urgent')}</MenuItem>
              </RhfTextField>
              <RhfTextField
                control={control}
                name="title"
                label={t('fields.title')}
                fullWidth
                sx={maintenanceStyles.rhfTextFieldSx}
              />
              <RhfTextField
                control={control}
                name="description"
                label={t('fields.description')}
                placeholder={t('fields.descriptionPlaceholder')}
                multiline
                minRows={4}
                fullWidth
                sx={maintenanceStyles.rhfTextFieldSx}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={maintenanceStyles.dialogActionsSx}>
            {mode === 'create' && (
              <Button color="error" disabled={submitting} onClick={() => setDiscardOpen(true)}>
                {t('discardDraft')}
              </Button>
            )}
            <Button type="button" variant="outlined" color="secondary" onClick={handleClose}>
              {mode === 'create' ? t('saveDraftAndClose') : t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={<AddRoundedIcon />}
            >
              {mode === 'edit' ? t('save') : t('submit')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <Dialog open={discardOpen} onClose={() => setDiscardOpen(false)}>
        <DialogTitle>{t('discardTitle')}</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDiscardOpen(false)}>{t('cancel')}</Button>
          <Button
            color="error"
            onClick={() => {
              reset(defaultValues)
              writeMaintenanceDraft(draftKey, null)
              setDiscardOpen(false)
              onClose()
            }}
          >
            {t('discardDraft')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
