'use client'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useSnackbar } from 'notistack'
import { extractErrorMessage } from '@shared/utils/error-message'

import { useUpdateTenantAccount } from '../hooks/use-tenants'
import { createTenantAccountSchema } from '../schemas/tenant-account-schema'
import {
  TENANT_ACCOUNT_TYPES,
  TENANT_STATUSES,
  type EditTenantAccountDialogProps,
  type TenantAccountFormValues,
} from '../types/tenant'
import { styles } from '../styles/edit-tenant-account-dialog.styles'

export function EditTenantAccountDialog({ tenant, onClose }: EditTenantAccountDialogProps) {
  const t = useTranslations('platform.account')
  const { enqueueSnackbar } = useSnackbar()
  const updateAccount = useUpdateTenantAccount()
  const schema = useMemo(() => createTenantAccountSchema(), [])
  const { control, handleSubmit, watch } = useForm<TenantAccountFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { accountType: tenant.accountType, status: tenant.status },
  })
  const status = watch('status')

  async function onSubmit(values: TenantAccountFormValues) {
    try {
      await updateAccount.mutateAsync({
        tenantId: tenant.id,
        accountType: values.accountType,
        status: values.status,
      })
      enqueueSnackbar(t('updateSuccess'), { variant: 'success' })
      onClose()
    } catch (error) {
      enqueueSnackbar(
        extractErrorMessage(error, t('updateError'), {
          FORBIDDEN: t('errors.forbidden'),
          TENANT_ACCOUNT_CHANGED_CONCURRENTLY: t('errors.changedConcurrently'),
          TENANT_NOT_FOUND: t('errors.notFound'),
        }),
        { variant: 'error' },
      )
    }
  }

  return (
    <Dialog open onClose={() => !updateAccount.isPending && onClose()} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle sx={styles.dialogTitle}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography sx={styles.typography}>{t('editTitle')}</Typography>
              <Typography sx={styles.typography2}>{tenant.name}</Typography>
            </Box>
            <IconButton
              aria-label={t('closeEditDialog')}
              onClick={onClose}
              disabled={updateAccount.isPending}
            >
              <CloseRoundedIcon sx={styles.closeRoundedIcon} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={styles.dialogContent}>
          <Stack spacing={2} sx={styles.stack}>
            <Controller
              control={control}
              name="accountType"
              render={({ field }) => (
                <TextField
                  select
                  label={t('fields.accountType')}
                  value={field.value}
                  onChange={field.onChange}
                  inputRef={field.ref}
                  helperText={t('fields.accountTypeHelper')}
                >
                  {TENANT_ACCOUNT_TYPES.map((accountType) => (
                    <MenuItem key={accountType} value={accountType}>
                      {t(`accountTypes.${accountType}`)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <TextField
                  select
                  label={t('fields.status')}
                  value={field.value}
                  onChange={field.onChange}
                  inputRef={field.ref}
                  helperText={
                    status === 'CANCELED' ? t('fields.canceledHelper') : t('fields.statusHelper')
                  }
                >
                  {TENANT_STATUSES.map((item) => (
                    <MenuItem key={item} value={item}>
                      {t(`statuses.${item}`)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={styles.dialogActions}>
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            onClick={onClose}
            disabled={updateAccount.isPending}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={updateAccount.isPending}>
            {t('save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
