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
import { useEffect } from 'react'
import { useSnackbar } from 'notistack'
import axios from 'axios'

import { iconSize } from '@shared/theme/tokens'

import { useUpdatePlatformAdmin } from '../hooks/use-update-platform-admin'
import {
  updatePlatformAdminSchema,
  type UpdatePlatformAdminFormValues,
} from '../schemas/update-platform-admin-schema'
import type { PlatformAdminAccount } from '../types/platform-admin'

type EditPlatformAdminDialogProps = {
  admin: PlatformAdminAccount | null
  onClose: () => void
}

export function EditPlatformAdminDialog({ admin, onClose }: EditPlatformAdminDialogProps) {
  const t = useTranslations('platform.admins')
  const { enqueueSnackbar } = useSnackbar()
  const updateAdmin = useUpdatePlatformAdmin()
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<UpdatePlatformAdminFormValues>({
    resolver: zodResolver(updatePlatformAdminSchema),
    defaultValues: { nome: '', email: '', role: 'ADMIN' },
  })

  useEffect(() => {
    if (admin) reset({ nome: admin.nome, email: admin.email, role: admin.role })
  }, [admin, reset])

  async function onSubmit(values: UpdatePlatformAdminFormValues) {
    if (!admin) return
    try {
      await updateAdmin.mutateAsync({
        id: admin.id,
        nome: values.nome,
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
    <Dialog
      open={Boolean(admin)}
      onClose={() => !updateAdmin.isPending && onClose()}
      fullWidth
      maxWidth="sm"
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography sx={{ color: 'text.primary', fontSize: 24, fontWeight: 900 }}>
                {t('editTitle')}
              </Typography>
            </Box>
            <IconButton
              aria-label={t('closeEditDialog')}
              onClick={onClose}
              disabled={updateAdmin.isPending}
            >
              <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2 }}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t('name')}
              error={Boolean(errors.nome)}
              helperText={errors.nome?.message}
              {...register('nome')}
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
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="ADMIN_AGENT">Admin + Agent</MenuItem>
                  <MenuItem value="AGENT">Agent</MenuItem>
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
