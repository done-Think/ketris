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

import { platformAdminRoles } from '../config/platform-admins'
import { useUpdatePlatformAdmin } from '../hooks/use-platform-admins'
import { createUpdatePlatformAdminSchema } from '../schemas/update-platform-admin-schema'
import type {
  EditPlatformAdminDialogProps,
  UpdatePlatformAdminFormValues,
} from '../types/platform-admin'
import { styles } from '../styles/edit-platform-admin-dialog.styles'

export function EditPlatformAdminDialog({ admin, onClose }: EditPlatformAdminDialogProps) {
  const t = useTranslations('platform.admins')
  const formErrorsT = useTranslations('platform.forms.errors')
  const { enqueueSnackbar } = useSnackbar()
  const updateAdmin = useUpdatePlatformAdmin()
  const schema = useMemo(
    () => createUpdatePlatformAdminSchema((key) => formErrorsT(key)),
    [formErrorsT],
  )
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<UpdatePlatformAdminFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: admin.name, email: admin.email, role: admin.role },
  })

  async function onSubmit(values: UpdatePlatformAdminFormValues) {
    try {
      await updateAdmin.mutateAsync({
        id: admin.id,
        name: values.name,
        email: values.email,
        role: values.role,
      })
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
    <Dialog open onClose={() => !updateAdmin.isPending && onClose()} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle sx={styles.dialogTitle}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography sx={styles.typography}>{t('editTitle')}</Typography>
            </Box>
            <IconButton
              aria-label={t('closeEditDialog')}
              onClick={onClose}
              disabled={updateAdmin.isPending}
            >
              <CloseRoundedIcon sx={styles.closeRoundedIcon} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={styles.dialogContent}>
          <Stack spacing={2} sx={styles.stack}>
            <TextField
              label={t('name')}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              {...register('name')}
              autoFocus
            />
            <TextField
              label={t('email')}
              type="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email')}
            />
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <TextField
                  select
                  label={t('role')}
                  value={field.value}
                  onChange={field.onChange}
                  inputRef={field.ref}
                >
                  {platformAdminRoles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {t(`roles.${role}`)}
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
            disabled={updateAdmin.isPending}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={updateAdmin.isPending}>
            {t('save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
