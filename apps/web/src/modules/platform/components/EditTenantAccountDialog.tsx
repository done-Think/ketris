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
import axios from 'axios'

import { iconSize } from '@shared/theme/tokens'

import { useUpdateTenantAccount } from '../hooks/use-update-tenant-account'
import { createTenantAccountSchema } from '../schemas/tenant-account-schema'
import {
  TENANT_ACCOUNT_TYPES,
  TENANT_STATUSES,
  type EditTenantAccountDialogProps,
  type TenantAccountFormValues,
} from '../types/tenant'

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
      await updateAccount.mutateAsync({ tenantId: tenant.id, ...values })
      enqueueSnackbar(t('updateSuccess'), { variant: 'success' })
      onClose()
    } catch (error) {
      const message =
        axios.isAxiosError(error) && typeof error.response?.data?.error?.message === 'string'
          ? error.response.data.error.message
          : t('updateError')
      enqueueSnackbar(message, { variant: 'error' })
    }
  }

  return (
    <Dialog open onClose={() => !updateAccount.isPending && onClose()} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography sx={{ color: 'text.primary', fontSize: 24, fontWeight: 900 }}>
                {t('editTitle')}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 0.5 }}>
                {tenant.name}
              </Typography>
            </Box>
            <IconButton
              aria-label={t('closeEditDialog')}
              onClick={onClose}
              disabled={updateAccount.isPending}
            >
              <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2 }}>
          <Stack spacing={2} sx={{ pt: 1 }}>
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
        <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }}>
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
