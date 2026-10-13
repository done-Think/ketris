'use client'

import { useEffect, useId, useMemo, useState, type ChangeEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useForm } from 'react-hook-form'

import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'
import { getInitials } from '@shared/utils/get-initials'

import {
  createChangeOwnPasswordSchema,
  createCurrentUserProfileSchema,
} from '../schemas/current-user-profile-schema'
import { userService } from '../services/user-service'
import type {
  ChangeOwnPasswordValues,
  CurrentUserProfileValues,
} from '../types/current-user-profile'

const DEMO_PHONE = '(35) 99999-9999'
const PHONE_MASK = [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]

export function CurrentUserProfilePage() {
  const t = useTranslations('common.profilePage')
  const { data: session, update } = useSession()
  const { enqueueSnackbar } = useSnackbar()
  const inputId = useId()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const user = session?.user
  const currentUserProfileSchema = useMemo(
    () => createCurrentUserProfileSchema((key) => t(`errors.${key}`)),
    [t],
  )
  const changeOwnPasswordSchema = useMemo(
    () => createChangeOwnPasswordSchema((key) => t(`errors.${key}`)),
    [t],
  )
  const profileForm = useForm<CurrentUserProfileValues>({
    resolver: zodResolver(currentUserProfileSchema),
    defaultValues: { name: user?.name ?? '', phone: DEMO_PHONE, email: user?.email ?? '' },
  })
  const passwordForm = useForm<ChangeOwnPasswordValues>({
    resolver: zodResolver(changeOwnPasswordSchema),
    defaultValues: { password: '', passwordConfirmation: '' },
  })
  const resetProfile = profileForm.reset

  useEffect(() => {
    resetProfile({ name: user?.name ?? '', phone: DEMO_PHONE, email: user?.email ?? '' })
  }, [user?.name, user?.email, resetProfile])

  useEffect(
    () => () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    },
    [avatarPreviewUrl],
  )

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProfileError(t('avatarFormatError'))
      event.target.value = ''
      return
    }
    setProfileError(null)
    setAvatarFile(file)
    setAvatarPreviewUrl(URL.createObjectURL(file))
  }

  async function saveProfile({ phone: _phone, ...values }: CurrentUserProfileValues) {
    if (!user?.id) return
    setProfileError(null)
    try {
      const avatarUrl = avatarFile
        ? await userService.uploadAvatar(avatarFile)
        : (user.image ?? null)
      const saved = await userService.update(user.id, { ...values, avatarUrl })
      await update({
        user: {
          ...user,
          name: saved.name,
          email: saved.email,
          image: saved.avatarUrl ?? undefined,
        },
      })
      profileForm.reset({ name: saved.name, phone: DEMO_PHONE, email: saved.email })
      setAvatarFile(null)
      setAvatarPreviewUrl(null)
      enqueueSnackbar(t('profileSuccess'), { variant: 'success' })
    } catch {
      setProfileError(t('profileError'))
    }
  }

  async function changePassword(values: ChangeOwnPasswordValues) {
    setPasswordError(null)
    try {
      await userService.changeOwnPassword(values.password)
      passwordForm.reset({ password: '', passwordConfirmation: '' })
      enqueueSnackbar(t('passwordSuccess'), { variant: 'success' })
    } catch {
      setPasswordError(t('passwordError'))
    }
  }

  const avatarUrl = avatarPreviewUrl ?? user?.image ?? undefined
  const panelSx = {
    p: { xs: 2, md: 3 },
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.md}px`,
    bgcolor: surface.paper,
    boxShadow: shadows.crmListPanel,
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 920,
        mx: 'auto',
        p: { xs: 2, md: 3.5 },
        pt: { xs: 10, md: 3.5 },
      }}
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h4" sx={{ color: brand.graphite[500], fontWeight: 900 }}>
            {t('title')}
          </Typography>
          <Typography sx={{ color: brand.neutral[500], mt: 0.5 }}>{t('subtitle')}</Typography>
        </Box>

        <Paper variant="outlined" sx={panelSx}>
          <Stack
            component="form"
            noValidate
            spacing={2.5}
            onSubmit={profileForm.handleSubmit(saveProfile)}
          >
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {t('personalData')}
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
            >
              <Avatar
                src={avatarUrl}
                alt={user?.name ?? ''}
                sx={{ width: 72, height: 72, bgcolor: 'primary.main' }}
              >
                {!avatarUrl ? getInitials(user?.name ?? '') : null}
              </Avatar>
              <Button
                component="label"
                htmlFor={inputId}
                variant="outlined"
                startIcon={<PhotoCameraOutlinedIcon />}
                disabled={profileForm.formState.isSubmitting}
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
            </Stack>
            <RhfTextField
              control={profileForm.control}
              name="name"
              label={t('name')}
              fullWidth
              autoComplete="name"
            />
            <RhfMaskedTextField
              control={profileForm.control}
              name="phone"
              label={t('phone')}
              mask={PHONE_MASK}
              fullWidth
              type="tel"
              autoComplete="tel"
            />
            <RhfTextField
              control={profileForm.control}
              name="email"
              label={t('email')}
              fullWidth
              type="email"
              autoComplete="email"
            />
            {profileError ? <Alert severity="error">{profileError}</Alert> : null}
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  profileForm.reset({
                    name: user?.name ?? '',
                    phone: DEMO_PHONE,
                    email: user?.email ?? '',
                  })
                  setAvatarFile(null)
                  setAvatarPreviewUrl(null)
                  setProfileError(null)
                }}
                disabled={profileForm.formState.isSubmitting}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={profileForm.formState.isSubmitting || !user?.id}
              >
                {profileForm.formState.isSubmitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  t('save')
                )}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={panelSx}>
          <Stack
            component="form"
            noValidate
            spacing={2.5}
            onSubmit={passwordForm.handleSubmit(changePassword)}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t('security')}
              </Typography>
              <Typography sx={{ color: brand.neutral[500] }}>{t('securityDescription')}</Typography>
            </Box>
            <RhfTextField
              control={passwordForm.control}
              name="password"
              label={t('newPassword')}
              type="password"
              autoComplete="new-password"
              fullWidth
            />
            <RhfTextField
              control={passwordForm.control}
              name="passwordConfirmation"
              label={t('confirmPassword')}
              type="password"
              autoComplete="new-password"
              fullWidth
            />
            {passwordError ? <Alert severity="error">{passwordError}</Alert> : null}
            <Stack direction="row" justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                disabled={passwordForm.formState.isSubmitting || !user?.id}
              >
                {passwordForm.formState.isSubmitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  t('changePassword')
                )}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}
