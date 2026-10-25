'use client'

import { useId, useState, type ChangeEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import { Alert, Avatar, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useForm, useWatch } from 'react-hook-form'

import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'
import { getApiErrorCode } from '@shared/utils/error-message'
import { getInitials } from '@shared/utils/get-initials'

import { useAvatarPreview } from '../hooks/use-avatar-preview'
import { useUpdateCurrentUser, useUploadAvatar } from '../hooks/use-current-user'
import { createCurrentUserProfileSchema } from '../schemas/current-user-profile-schema'
import { styles } from '../styles/current-user-profile-page.styles'
import type {
  CurrentUserProfileFormProps,
  CurrentUserProfileValues,
} from '../types/current-user-profile'
import { EmailChangeDialog } from './EmailChangeDialog'

const PHONE_MASK = [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]

export function CurrentUserPersonalDataForm({ user }: CurrentUserProfileFormProps) {
  const t = useTranslations('common.profilePage')
  const { update } = useSession()
  const { enqueueSnackbar } = useSnackbar()
  const inputId = useId()
  const [emailChangeOpen, setEmailChangeOpen] = useState(false)
  const save = useUpdateCurrentUser()
  const upload = useUploadAvatar()
  const form = useForm<CurrentUserProfileValues>({
    resolver: zodResolver(
      createCurrentUserProfileSchema((key) => t(`errors.${key}`), user.role === 'AGENT'),
    ),
    defaultValues: {
      name: user.name,
      phone: user.phone ?? '',
      email: user.email,
      creci: user.creci ?? '',
      avatarFile: null,
    },
  })
  const avatarFile = useWatch({ control: form.control, name: 'avatarFile' })
  const preview = useAvatarPreview(avatarFile)
  const avatarUrl = preview ?? user.avatarUrl ?? undefined
  const busy = form.formState.isSubmitting

  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      form.setError('root', { message: t('avatarFormatError') })
      return
    }
    form.clearErrors('root')
    form.setValue('avatarFile', file, { shouldDirty: true })
  }

  async function saveProfile(values: CurrentUserProfileValues) {
    form.clearErrors('root')
    try {
      const nextAvatarUrl = values.avatarFile
        ? await upload.mutateAsync(values.avatarFile)
        : (user.avatarUrl ?? null)
      const saved = await save.mutateAsync({
        name: values.name,
        phone: values.phone,
        ...(user.role === 'AGENT' ? { creci: values.creci } : {}),
        avatarUrl: nextAvatarUrl,
      })
      form.reset({
        name: saved.name,
        phone: saved.phone ?? '',
        email: saved.email,
        creci: saved.creci ?? '',
        avatarFile: null,
      })
      await update()
      enqueueSnackbar(t('profileSuccess'), { variant: 'success' })
    } catch (error) {
      const code = getApiErrorCode(error)
      const key =
        code === 'AVATAR_VALIDATION_ERROR'
          ? 'avatarFormatError'
          : code === 'FORBIDDEN' || code === 'ACCOUNT_DEACTIVATED'
            ? 'permissionError'
            : 'profileError'
      form.setError('root', { message: t(key) })
    }
  }

  return (
    <>
      <Paper variant="outlined" sx={styles.panel}>
        <Stack component="form" noValidate spacing={2.5} onSubmit={form.handleSubmit(saveProfile)}>
          <Typography variant="h6" sx={styles.typography3}>
            {t('personalData')}
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <Avatar src={avatarUrl} alt={user.name} sx={styles.avatar}>
              {!avatarUrl ? getInitials(user.name) : null}
            </Avatar>
            <Button
              component="label"
              htmlFor={inputId}
              variant="outlined"
              startIcon={<PhotoCameraOutlinedIcon />}
              disabled={busy}
            >
              {t('changePhoto')}
              <input
                id={inputId}
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={selectAvatar}
                disabled={busy}
              />
            </Button>
          </Stack>
          <RhfTextField
            control={form.control}
            name="name"
            label={t('name')}
            fullWidth
            autoComplete="name"
            disabled={busy}
          />
          <RhfMaskedTextField
            control={form.control}
            name="phone"
            label={t('phone')}
            mask={PHONE_MASK}
            fullWidth
            type="tel"
            autoComplete="tel"
            InputProps={{ readOnly: busy }}
          />
          {user.role === 'AGENT' ? (
            <RhfTextField
              control={form.control}
              name="creci"
              label={t('creci')}
              fullWidth
              disabled={busy}
            />
          ) : null}
          <RhfTextField
            control={form.control}
            name="email"
            label={t('email')}
            fullWidth
            type="email"
            autoComplete="email"
            InputProps={{ readOnly: true }}
          />
          <Button
            type="button"
            variant="outlined"
            onClick={() => setEmailChangeOpen(true)}
            disabled={busy}
          >
            {t('changeEmail')}
          </Button>
          {form.formState.errors.root?.message ? (
            <Alert severity="error">{form.formState.errors.root.message}</Alert>
          ) : null}
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button
              type="button"
              variant="outlined"
              disabled={busy}
              onClick={() =>
                form.reset({
                  name: user.name,
                  phone: user.phone ?? '',
                  email: user.email,
                  creci: user.creci ?? '',
                  avatarFile: null,
                })
              }
            >
              {t('cancel')}
            </Button>
            <Button type="submit" variant="contained" disabled={busy}>
              {busy ? <CircularProgress size={18} color="inherit" /> : t('save')}
            </Button>
          </Stack>
        </Stack>
      </Paper>
      {emailChangeOpen ? <EmailChangeDialog onClose={() => setEmailChangeOpen(false)} /> : null}
    </>
  )
}
