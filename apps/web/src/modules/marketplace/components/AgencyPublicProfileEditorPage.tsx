'use client'

import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'
import { Controller } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { DashboardNotificationsButton, DashboardPageHeader } from '@shared/components/layout'

import {
  useOwnAgencyProfile,
  usePublishAgencyProfile,
  useSaveAgencyProfile,
  useUnpublishAgencyProfile,
} from '../hooks/use-agency-profile'
import { usePublicProfileEditor } from '../hooks/use-public-profile-editor'
import { useTenantAgents } from '../hooks/use-tenant-agents'
import { createAgencyPublicProfileEditorSchema } from '../schemas/agency-public-profile-editor-schema'
import {
  toDraft,
  toFormValues,
  toPreviewProfile,
} from '../utils/agency-public-profile-editor-adapter'
import { editorPanelSx } from './public-profile-editor/public-profile-editor-shared'
import { SingleImageUploadField } from './public-profile-editor/SingleImageUploadField'
import { AgencyPublicProfilePage } from './AgencyPublicProfilePage'

export function AgencyPublicProfileEditorPage() {
  const locale = useLocale() as AppLocale
  const t = useTranslations('marketplace.agencyProfileEditor')
  const tFeatures = useTranslations('marketplace.propertyFeatures')
  const { data: profile } = useOwnAgencyProfile()
  const { data: tenantAgents } = useTenantAgents()
  const schema = useMemo(
    () => createAgencyPublicProfileEditorSchema((key) => t(`errors.${key}`)),
    [t],
  )
  const publishSchema = useMemo(
    () =>
      createAgencyPublicProfileEditorSchema((key) => t(`errors.${key}`), {
        requirePublishFields: true,
      }),
    [t],
  )
  const editor = usePublicProfileEditor({
    profile,
    toFormValues,
    toDraft,
    resolver: zodResolver(schema),
    publishSchema,
    save: useSaveAgencyProfile(),
    publish: usePublishAgencyProfile(),
    unpublish: useUnpublishAgencyProfile(),
    messages: (key) => t(key),
  })
  const { control } = editor.form
  const isEditing = editor.isEditing

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <DashboardPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <DashboardNotificationsButton />
          </Box>
        }
        sx={{ mb: 2.6 }}
      />

      <Box component="form" noValidate onSubmit={editor.submit} sx={{ width: '100%' }}>
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
                name="legalCreci"
                label={t('fields.legalCreci')}
                disabled={!isEditing}
              />
              <RhfTextField
                control={control}
                name="headquarters"
                label={t('fields.headquarters')}
                disabled={!isEditing}
              />
              <RhfTextField
                control={control}
                name="address"
                label={t('fields.address')}
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
                name="email"
                label={t('fields.email')}
                disabled={!isEditing}
              />
              <RhfTextField
                control={control}
                name="coverage"
                label={t('fields.coverage')}
                helperText={t('fields.commaSeparatedHint')}
                disabled={!isEditing}
              />
              <RhfTextField
                control={control}
                name="segments"
                label={t('fields.segments')}
                helperText={t('fields.commaSeparatedHint')}
                disabled={!isEditing}
              />
              <RhfTextField
                control={control}
                name="yearsInMarket"
                label={t('fields.yearsInMarket')}
                disabled={!isEditing}
              />
              <RhfTextField
                control={control}
                name="summary"
                label={t('fields.summary')}
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                type="button"
                variant="outlined"
                startIcon={<VisibilityOutlinedIcon />}
                onClick={editor.openPreview}
                sx={{ flex: 1 }}
              >
                {t('actions.preview')}
              </Button>
              {isEditing ? (
                <Button
                  key="save-button"
                  type="submit"
                  variant="contained"
                  disabled={editor.isSaving}
                  sx={{ flex: 1 }}
                >
                  {t('actions.save')}
                </Button>
              ) : (
                <Button
                  key="edit-button"
                  type="button"
                  variant="contained"
                  onClick={editor.startEditing}
                  sx={{ flex: 1 }}
                >
                  {t('actions.edit')}
                </Button>
              )}
              {profile ? (
                <Button
                  type="button"
                  variant="outlined"
                  color={editor.isPublished ? 'error' : 'success'}
                  onClick={editor.togglePublished}
                  disabled={editor.isTogglingPublished}
                  sx={{ flex: 1 }}
                >
                  {editor.isPublished ? t('actions.unpublish') : t('actions.publish')}
                </Button>
              ) : null}
            </Stack>

            <Box sx={editorPanelSx}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {t('fields.appearance')}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  gap: 1.6,
                }}
              >
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
                  name="logoUrl"
                  label={t('fields.logoUrl')}
                  target="agency-logo"
                  variant="avatar"
                  disabled={!isEditing}
                />
                <SingleImageUploadField
                  control={control}
                  name="bannerUrl"
                  label={t('fields.bannerUrl')}
                  target="agency-banner"
                  variant="banner"
                  disabled={!isEditing}
                />
              </Box>
            </Box>
          </Stack>

          <Box sx={{ ...editorPanelSx, gridColumn: { xl: '1 / -1' } }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {t('fields.team')}
            </Typography>
            <Controller
              control={control}
              name="team"
              render={({ field, fieldState }) => (
                <Autocomplete
                  multiple
                  disabled={!isEditing}
                  options={tenantAgents ?? []}
                  value={(tenantAgents ?? []).filter((agent) =>
                    field.value.some((member) => member.usuarioId === agent.id),
                  )}
                  getOptionLabel={(agent) => agent.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  slotProps={{
                    popper: {
                      placement: 'top-start',
                      modifiers: [{ name: 'flip', enabled: false }],
                    },
                  }}
                  onChange={(_event, selected) =>
                    field.onChange(
                      selected
                        .slice(0, 6)
                        .map((agent) => ({ usuarioId: agent.id, name: agent.name })),
                    )
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('fields.teamPicker')}
                      placeholder={t('fields.teamPickerPlaceholder')}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              )}
            />
          </Box>
        </Box>
      </Box>

      <Dialog open={editor.isPreviewOpen} onClose={editor.closePreview} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          <AgencyPublicProfilePage
            agency={toPreviewProfile(
              editor.draft,
              profile ?? null,
              locale,
              tFeatures,
              t('previewName'),
            )}
          />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
