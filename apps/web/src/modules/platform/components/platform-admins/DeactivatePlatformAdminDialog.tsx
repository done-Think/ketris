'use client'

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { useDeactivatePlatformAdmin } from '../../hooks/use-platform-admins'
import type { DeactivatePlatformAdminDialogProps } from '../../types/platform-admin'

export function DeactivatePlatformAdminDialog({
  admin,
  onClose,
}: DeactivatePlatformAdminDialogProps) {
  const t = useTranslations('platform.admins')
  const { enqueueSnackbar } = useSnackbar()
  const deactivateAdmin = useDeactivatePlatformAdmin()

  async function confirm() {
    try {
      await deactivateAdmin.mutateAsync(admin.id)
      enqueueSnackbar(t('updateSuccess'), { variant: 'success' })
      onClose()
    } catch {
      enqueueSnackbar(t('updateError'), { variant: 'error' })
    }
  }

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>{t('deactivateTitle')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('deactivateDescription', { name: admin.name })}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button
          color="error"
          variant="contained"
          onClick={confirm}
          disabled={deactivateAdmin.isPending}
        >
          {t('deactivate')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
