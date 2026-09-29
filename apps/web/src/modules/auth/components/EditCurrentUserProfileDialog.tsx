'use client'

import { useEffect, useId, useState, type ChangeEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import {
  Alert,
  Avatar,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { useSnackbar } from 'notistack'
import { useTranslations } from 'next-intl'

import { RhfTextField } from '@shared/components/form'
import { radius } from '@shared/theme/tokens'
import { getInitials } from '@shared/utils/get-initials'

import {
  updateCurrentUserProfileSchema,
  type UpdateCurrentUserProfileValues,
} from '../schemas/update-current-user-profile-schema'
import { userService } from '../services/user-service'
import type { TenantUser } from '../types/user'

type EditCurrentUserProfileDialogProps = {
  open: boolean
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string | null
  }
  onClose: () => void
  onUpdated: (user: TenantUser) => Promise<void>
}

export function EditCurrentUserProfileDialog({
  open,
  user,
  onClose,
  onUpdated,
}: EditCurrentUserProfileDialogProps) {
  const t = useTranslations('common.appShell.profileEditor')
  const { enqueueSnackbar } = useSnackbar()
  const inputId = useId()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<UpdateCurrentUserProfileValues>({
    resolver: zodResolver(updateCurrentUserProfileSchema),
    defaultValues: { name: user.name, email: user.email },
  })

  useEffect(() => {
    if (!open) return

    reset({ name: user.name, email: user.email })
    setAvatarFile(null)
    setAvatarPreviewUrl(null)
    setSubmitError(null)
  }, [open, reset, user.email, user.name])

  useEffect(
    () => () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    },
    [avatarPreviewUrl],
  )

  function handleClose() {
    if (isSubmitting) return

    onClose()
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSubmitError(t('avatarFormatError'))
      event.target.value = ''
      return
    }

    setSubmitError(null)
    setAvatarFile(file)
    setAvatarPreviewUrl(URL.createObjectURL(file))
  }

  async function onSubmit(values: UpdateCurrentUserProfileValues) {
    setSubmitError(null)

    try {
      const avatarUrl = avatarFile
        ? await userService.uploadAvatar(avatarFile)
        : (user.avatarUrl ?? null)
      const updatedUser = await userService.update(user.id, { ...values, avatarUrl })

      await onUpdated(updatedUser)
      enqueueSnackbar(t('success'), { variant: 'success' })
      onClose()
    } catch {
      setSubmitError(t('saveError'))
    }
  }

  const avatarUrl = avatarPreviewUrl ?? user.avatarUrl ?? undefined

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="edit-profile-title"
    >
      <Stack component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle id="edit-profile-title">{t('title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            <Stack alignItems="center" spacing={1.25}>
              <Avatar
                src={avatarUrl}
                alt={user.name}
                sx={{
                  width: 88,
                  height: 88,
                  bgcolor: 'primary.main',
                  fontSize: 22,
                  fontWeight: 800,
                }}
              >
                {!avatarUrl ? getInitials(user.name) : null}
              </Avatar>
              <Button
                component="label"
                htmlFor={inputId}
                variant="outlined"
                startIcon={<PhotoCameraOutlinedIcon />}
                disabled={isSubmitting}
                sx={{ borderRadius: `${radius.sm}px`, textTransform: 'none' }}
              >
                {t('changePhoto')}
                <input
                  id={inputId}
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                />
              </Button>
              {avatarFile ? (
                <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                  {avatarFile.name}
                </Typography>
              ) : null}
            </Stack>

            <RhfTextField control={control} name="name" label={t('name')} fullWidth autoFocus />
            <RhfTextField
              control={control}
              name="email"
              label={t('email')}
              type="email"
              autoComplete="email"
              fullWidth
            />

            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            type="button"
            variant="outlined"
            onClick={handleClose}
            disabled={isSubmitting}
            sx={{ borderRadius: `${radius.sm}px`, textTransform: 'none' }}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{ borderRadius: `${radius.sm}px`, textTransform: 'none' }}
          >
            {isSubmitting ? <CircularProgress size={18} color="inherit" /> : t('save')}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  )
}
