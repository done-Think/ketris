'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
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
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { iconSize, brand, radius } from '@shared/theme/tokens'

import { useMaintenanceOptions } from '../hooks/use-maintenance'
import {
  maintenanceDraftKey,
  readMaintenanceDraft,
  writeMaintenanceDraft,
} from '../utils/maintenance-draft'

import { createMaintenanceTicketSchema } from '../schemas/maintenance-ticket-schema'
import { MAINTENANCE_CATEGORIES } from '../utils/maintenance-category'
import type {
  MaintenanceCreateTicketDialogProps,
  MaintenanceCreateTicketFormValues,
  MaintenanceTicketFormProps,
} from '../types/maintenance'

const defaultValues: MaintenanceCreateTicketFormValues = {
  contractId: '',
  category: '',
  priority: 'normal',
  title: '',
  description: '',
}

export function MaintenanceCreateTicketDialog({
  open,
  onClose,
  onCreate,
  initialValues,
  mode = 'create',
}: MaintenanceCreateTicketDialogProps) {
  const t = useTranslations('dashboard.maintenance.createDialog')
  const { data: session } = useSession()
  const draftKey = maintenanceDraftKey(session?.tenantId, session?.user?.id)
  const [submitting, setSubmitting] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)

  function handleClose() {
    if (submitting) return
    onClose()
  }

  async function handleCreate(values: MaintenanceCreateTicketFormValues) {
    if (submitting) return false
    setSubmitting(true)
    try {
      return (await onCreate(values)) !== false
    } finally {
      setSubmitting(false)
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
            sx: {
              borderRadius: `${radius.sm}px`,
              maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
            },
          },
        }}
      >
        {/* The form mounts with the dialog, so its defaults are read once per opening. In edit mode
            it waits for the ticket, instead of resetting itself when the data arrives. */}
        {mode === 'create' || initialValues ? (
          <MaintenanceTicketForm
            mode={mode}
            initialValues={mode === 'create' ? readMaintenanceDraft(draftKey) : initialValues}
            draftKey={draftKey}
            submitting={submitting}
            onSubmit={handleCreate}
            onClose={handleClose}
            onDiscard={() => setDiscardOpen(true)}
          />
        ) : (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
            <CircularProgress aria-label={t('title')} />
          </Box>
        )}
      </Dialog>
      <Dialog open={discardOpen} onClose={() => setDiscardOpen(false)}>
        <DialogTitle>{t('discardTitle')}</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDiscardOpen(false)}>{t('cancel')}</Button>
          <Button
            color="error"
            onClick={() => {
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

function MaintenanceTicketForm({
  mode,
  initialValues,
  draftKey,
  submitting,
  onSubmit,
  onClose,
  onDiscard,
}: MaintenanceTicketFormProps) {
  const t = useTranslations('dashboard.maintenance.createDialog')
  const maintenanceT = useTranslations('dashboard.maintenance')
  const { data: options } = useMaintenanceOptions()
  const { data: session } = useSession()
  const maintenanceTicketSchema = useMemo(
    () => createMaintenanceTicketSchema((key) => t(`errors.${key}`)),
    [t],
  )
  const { control, handleSubmit, reset, watch } = useForm<MaintenanceCreateTicketFormValues>({
    defaultValues: { ...defaultValues, ...initialValues },
    resolver: zodResolver(maintenanceTicketSchema),
  })

  // Keeps the create draft in localStorage while the user types.
  useEffect(() => {
    if (mode !== 'create') return
    const subscription = watch((values) =>
      writeMaintenanceDraft(draftKey, values as MaintenanceCreateTicketFormValues),
    )
    return () => subscription.unsubscribe()
  }, [draftKey, mode, watch])

  const handleClose = onClose

  async function submit(values: MaintenanceCreateTicketFormValues) {
    if (!(await onSubmit(values))) return
    reset(defaultValues)
    // After the reset, which the draft subscription would otherwise save as an empty draft.
    if (mode === 'create') writeMaintenanceDraft(draftKey, null)
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(submit)}>
      <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
            {mode === 'edit' ? t('editTitle') : t('title')}
          </Typography>
          <IconButton aria-label={t('close')} onClick={handleClose}>
            <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 1.6,
            pt: 0.5,
          }}
        >
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
              !options?.contracts.some((contract) => contract.id === initialValues.contractId) && (
                <MenuItem value={initialValues.contractId}>{t('currentContract')}</MenuItem>
              )}
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
            {MAINTENANCE_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {maintenanceT(`categories.${category}`)}
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
            sx={{ gridColumn: { sm: '1 / -1' } }}
          />
          <RhfTextField
            control={control}
            name="description"
            label={t('fields.description')}
            placeholder={t('fields.descriptionPlaceholder')}
            multiline
            minRows={4}
            fullWidth
            sx={{ gridColumn: { sm: '1 / -1' } }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0, flexWrap: 'wrap', gap: 1 }}>
        {mode === 'create' && (
          <Button color="error" disabled={submitting} onClick={onDiscard}>
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
  )
}
