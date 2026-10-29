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
import { getApiErrorCode } from '@shared/utils/error-message'

import { useDeactivatePlatformAdmin } from '../../hooks/use-platform-admins'
import type { DeactivatePlatformAdminDialogProps } from '../../types/platform-admin'

export function DeactivatePlatformAdminDialog({
  admin,
  onClose,
}: DeactivatePlatformAdminDialogProps) {
  const t = useTranslations('platform.admins')
  const errorsT = useTranslations('platform.errors')
  const { enqueueSnackbar } = useSnackbar()
  const deactivateAdmin = useDeactivatePlatformAdmin()

  async function confirm() {
    try {
      await deactivateAdmin.mutateAsync(admin.id)
      enqueueSnackbar(t('updateSuccess'), { variant: 'success' })
      onClose()
    } catch (error) {
      enqueueSnackbar(
        getApiErrorCode(error) === 'LAST_PLATFORM_ADMIN'
          ? errorsT('lastPlatformAdmin')
          : t('updateError'),
        { variant: 'error' },
      )
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
