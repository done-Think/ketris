'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Box, Dialog, DialogContent, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
} from '@shared/components/layout'
import { alpha, brand, iconSize, surface } from '@shared/theme/tokens'

import {
  useOwnBrokerProfile,
  usePublishBrokerProfile,
  useSaveBrokerProfile,
  useUnpublishBrokerProfile,
} from '../hooks/use-broker-profile'
import {
  createPublicProfileEditorSchema,
  type PublicProfileEditorFormValues,
} from '../schemas/public-profile-editor-schema'
import {
  emptyValues,
  toDraft,
  toFormValues,
  toPreviewProfile,
} from '../utils/public-profile-editor-adapter'
import { BrokerPublicProfilePage } from './BrokerPublicProfilePage'
import { editorPanelSx } from './public-profile-editor/public-profile-editor-shared'
import { SingleImageUploadField } from './public-profile-editor/SingleImageUploadField'

export function PublicProfileEditorPage() {
  const t = useTranslations('marketplace.profileEditor')
  const { enqueueSnackbar } = useSnackbar()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const { data: profile } = useOwnBrokerProfile()
  const saveProfile = useSaveBrokerProfile()
  const publishProfile = usePublishBrokerProfile()
  const unpublishProfile = useUnpublishBrokerProfile()
  const [isEditing, setIsEditing] = useState(false)
  const publicProfileEditorSchema = useMemo(
    () => createPublicProfileEditorSchema((key) => t(`errors.${key}`)),
    [t],
  )
  const publishRequiredFieldsSchema = useMemo(
    () =>
      createPublicProfileEditorSchema((key) => t(`errors.${key}`), { requirePublishFields: true }),
    [t],
  )

  const {
    control,
    formState: { isSubmitSuccessful },
    handleSubmit,
    reset,
    setError,
    watch,
  } = useForm<PublicProfileEditorFormValues>({
    defaultValues: emptyValues,
    resolver: zodResolver(publicProfileEditorSchema),
  })

  useEffect(() => {
    reset(toFormValues(profile ?? null))
  }, [profile, reset])

  const draft = watch()

  function onSubmit(values: PublicProfileEditorFormValues) {
    saveProfile.mutate(toDraft(values), {
      onSuccess: () => {
        enqueueSnackbar(t('saveSuccess'), { variant: 'success' })
        setIsEditing(false)
      },
      onError: () => enqueueSnackbar(t('saveError'), { variant: 'error' }),
    })
  }

  function handleUnpublish() {
    unpublishProfile.mutate(undefined, {
      onSuccess: () => enqueueSnackbar(t('unpublishSuccess'), { variant: 'success' }),
      onError: () => enqueueSnackbar(t('publishError'), { variant: 'error' }),
    })
  }

  const handlePublish = handleSubmit((values) => {
    const publishCheck = publishRequiredFieldsSchema.safeParse(values)

    if (!publishCheck.success) {
      setIsEditing(true)

      for (const issue of publishCheck.error.issues) {
        const field = issue.path[0]

        if (typeof field === 'string') {
          setError(field as keyof PublicProfileEditorFormValues, { message: issue.message })
        }
      }

      return
    }

    saveProfile.mutate(toDraft(values), {
      onSuccess: () => {
        publishProfile.mutate(undefined, {
          onSuccess: () => {
            enqueueSnackbar(t('publishSuccess'), { variant: 'success' })
            setIsEditing(false)
          },
          onError: () => enqueueSnackbar(t('publishError'), { variant: 'error' }),
        })
      },
      onError: () => enqueueSnackbar(t('saveError'), { variant: 'error' }),
    })
  })

  function handlePublishToggle() {
    if (profile?.status === 'PUBLISHED') {
      handleUnpublish()
      return
    }

    void handlePublish()
  }

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <DashboardPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.2}
            sx={{
              width: { xs: '100%', md: 'auto' },
              alignItems: { xs: 'stretch', sm: 'center' },
            }}
          >
            {isSubmitSuccessful ? (
              <Stack
                direction="row"
                spacing={0.8}
                alignItems="center"
                sx={{ color: brand.semantic.success }}
              >
                <CheckCircleOutlineRoundedIcon sx={{ fontSize: iconSize.md }} />
                <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                  {t('validatedDraft')}
                </Typography>
              </Stack>
            ) : null}
            <DashboardHeaderActionButton
              variant="outlined"
              color="secondary"
              startIcon={<VisibilityOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
              onClick={() => setIsPreviewOpen(true)}
              sx={{
                borderColor: alpha.graphite[8],
                '&:hover': {
                  borderColor: alpha.graphite[18],
                  bgcolor: surface.paper,
                  boxShadow: 'none',
                },
              }}
            >
              {t('actions.preview')}
            </DashboardHeaderActionButton>
            {isEditing ? (
              <DashboardHeaderActionButton
                key="save-button"
                type="submit"
                form="broker-public-profile-editor-form"
                startIcon={<SaveOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
                disabled={saveProfile.isPending}
              >
                {t('actions.save')}
              </DashboardHeaderActionButton>
            ) : (
              <DashboardHeaderActionButton
                key="edit-button"
                type="button"
                onClick={() => setIsEditing(true)}
                startIcon={<SaveOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
              >
                {t('actions.edit')}
              </DashboardHeaderActionButton>
            )}
            {profile ? (
              <DashboardHeaderActionButton
                variant="outlined"
                color={profile.status === 'PUBLISHED' ? 'error' : 'success'}
                onClick={handlePublishToggle}
                disabled={publishProfile.isPending || unpublishProfile.isPending}
              >
                {profile.status === 'PUBLISHED' ? t('actions.unpublish') : t('actions.publish')}
              </DashboardHeaderActionButton>
            ) : null}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <DashboardNotificationsButton />
            </Box>
          </Stack>
        }
        sx={{ mb: 2.6 }}
      />

      <Box
        id="broker-public-profile-editor-form"
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        sx={{ width: '100%' }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 3fr) minmax(420px, 2fr)' },
            alignItems: { xs: 'start', xl: 'stretch' },
            columnGap: { xs: 2.2, xl: 4 },
            rowGap: 2.2,
          }}
        >
          <Box sx={{ ...editorPanelSx, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {t('fields.mainInfo')}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gridTemplateRows: { xl: 'auto auto auto auto minmax(0, 1fr)' },
                gap: 1.6,
                flex: 1,
              }}
            >
              <RhfTextField
                control={control}
                name="headline"
                label={t('fields.headline')}
                disabled={!isEditing}
                sx={{ gridColumn: { md: '1 / -1' } }}
              />
              <RhfTextField
                control={control}
                name="displayName"
                label={t('fields.displayName')}
                disabled={!isEditing}
              />
              <RhfTextField
                control={control}
                name="creci"
                label={t('fields.creci')}
                disabled={!isEditing}
              />
              <RhfTextField
                control={control}
                name="phone"
                label={t('fields.phone')}
                disabled={!isEditing}
              />
              <RhfTextField
                control={control}
                name="region"
                label={t('fields.region')}
                disabled={!isEditing}
              />
              <RhfTextField
                control={control}
                name="neighborhoods"
                label={t('fields.neighborhoods')}
                helperText={t('fields.commaSeparatedHint')}
                disabled={!isEditing}
              />
              <RhfTextField
                control={control}
                name="specialties"
                label={t('fields.specialties')}
                helperText={t('fields.commaSeparatedHint')}
                disabled={!isEditing}
              />
              <RhfTextField
                control={control}
                name="availability"
                label={t('fields.availability')}
                disabled={!isEditing}
              />
              <RhfTextField
                control={control}
                name="bio"
                label={t('fields.bio')}
                multiline
                minRows={6}
                fullWidth
                disabled={!isEditing}
                sx={{
                  gridColumn: { md: '1 / -1' },
                  '& .MuiInputBase-root': { alignItems: 'flex-start', height: { xl: '100%' } },
                  '& textarea': { height: { xl: '100% !important' } },
                }}
              />
            </Box>
          </Box>

          <Stack spacing={2}>
            <Box sx={editorPanelSx}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {t('fields.appearance')}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                  gap: 1.6,
                }}
              >
                <RhfTextField
                  control={control}
                  name="primaryColor"
                  label={t('fields.primaryColor')}
                  type="color"
                  disabled={!isEditing}
                />
                <RhfTextField
                  control={control}
                  name="secondaryColor"
                  label={t('fields.secondaryColor')}
                  type="color"
                  disabled={!isEditing}
                />
                <RhfTextField
                  control={control}
                  name="backgroundColor"
                  label={t('fields.backgroundColor')}
                  type="color"
                  disabled={!isEditing}
                />
              </Box>
            </Box>

            <Box sx={editorPanelSx}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {t('fields.images')}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  alignItems: 'stretch',
                  gap: 1.6,
                }}
              >
                <SingleImageUploadField
                  control={control}
                  name="avatarUrl"
                  label={t('fields.photoUrl')}
                  target="broker-avatar"
                  variant="avatar"
                  disabled={!isEditing}
                />
                <SingleImageUploadField
                  control={control}
                  name="bannerUrl"
                  label={t('fields.bannerUrl')}
                  target="broker-banner"
                  variant="banner"
                  disabled={!isEditing}
                />
              </Box>
            </Box>
          </Stack>
        </Box>
      </Box>

      <Dialog open={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          <BrokerPublicProfilePage broker={toPreviewProfile(draft, profile ?? null)} />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
