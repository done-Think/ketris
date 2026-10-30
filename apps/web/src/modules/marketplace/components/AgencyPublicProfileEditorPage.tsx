'use client'

import { Autocomplete, Box, Stack, TextField } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Controller } from 'react-hook-form'

import type { AppLocale } from '@/i18n/types/locale.types'
import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'

import {
  useOwnAgencyProfile,
  usePublishAgencyProfile,
  useSaveAgencyProfile,
  useUnpublishAgencyProfile,
} from '../hooks/use-agency-profile'
import { usePublicProfileEditor } from '../hooks/use-public-profile-editor'
import { useTenantAgents } from '../hooks/use-tenant-agents'
import { createAgencyPublicProfileEditorSchema } from '../schemas/agency-public-profile-editor-schema'
import { styles, teamPickerSlotProps } from '../styles/public-profile-editor.styles'
import type { AgencyProfileEditorProps } from '../types/profile-editor'
import {
  toDraft,
  toFormValues,
  toPreviewProfile,
} from '../utils/agency-public-profile-editor-adapter'
import { AgencyPublicProfilePage } from './AgencyPublicProfilePage'
import { PublicProfileEditorLoader } from './public-profile-editor/PublicProfileEditorLoader'
import { PublicProfileEditorPanel } from './public-profile-editor/PublicProfileEditorPanel'
import { PublicProfileEditorShell } from './public-profile-editor/PublicProfileEditorShell'
import { SingleImageUploadField } from './public-profile-editor/SingleImageUploadField'

const formId = 'agency-public-profile-editor-form'
const phoneMask = [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]

export function AgencyPublicProfileEditorPage() {
  const t = useTranslations('marketplace.agencyProfileEditor')
  const profileQuery = useOwnAgencyProfile()

  return (
    <PublicProfileEditorLoader
      isPending={profileQuery.isPending}
      isError={profileQuery.isError}
      errorLabel={t('loadError')}
      retryLabel={t('retry')}
      onRetry={() => void profileQuery.refetch()}
    >
      <AgencyProfileEditor
        key={profileQuery.data?.id ?? 'new'}
        profile={profileQuery.data ?? null}
      />
    </PublicProfileEditorLoader>
  )
}

function AgencyProfileEditor({ profile }: AgencyProfileEditorProps) {
  const locale = useLocale() as AppLocale
  const t = useTranslations('marketplace.agencyProfileEditor')
  const tFeatures = useTranslations('marketplace.propertyFeatures')
  const { data: tenantAgents } = useTenantAgents()
  const schemas = useMemo(
    () => ({
      draft: createAgencyPublicProfileEditorSchema((key) => t(`errors.${key}`)),
      publish: createAgencyPublicProfileEditorSchema((key) => t(`errors.${key}`), {
        requirePublishFields: true,
      }),
    }),
    [t],
  )
  const editor = usePublicProfileEditor({
    status: profile?.status ?? null,
    defaultValues: toFormValues(profile),
    schema: schemas.draft,
    publishSchema: schemas.publish,
    toDraft,
    save: useSaveAgencyProfile(),
    publish: usePublishAgencyProfile(),
    unpublish: useUnpublishAgencyProfile(),
    messages: {
      saveSuccess: t('saveSuccess'),
      saveError: t('saveError'),
      publishSuccess: t('publishSuccess'),
      publishError: t('publishError'),
      unpublishSuccess: t('unpublishSuccess'),
    },
  })
  const { control, formState } = editor.form
  const disabled = !editor.isEditing

  return (
    <PublicProfileEditorShell
      formId={formId}
      title={t('title')}
      subtitle={t('subtitle')}
      labels={{
        preview: t('actions.preview'),
        edit: t('actions.edit'),
        save: t('actions.save'),
        publish: t('actions.publish'),
        unpublish: t('actions.unpublish'),
        validatedDraft: t('validatedDraft'),
      }}
      status={profile?.status ?? null}
      isEditing={editor.isEditing}
      isSaving={editor.isSaving}
      isTogglingPublish={editor.isTogglingPublish}
      showValidated={formState.isSubmitSuccessful}
      onEdit={editor.startEditing}
      onTogglePublish={editor.togglePublish}
      onSubmit={editor.onSubmit}
      previewOpen={editor.isPreviewOpen}
      onOpenPreview={editor.openPreview}
      onClosePreview={editor.closePreview}
      preview={
        <AgencyPublicProfilePage
          agency={toPreviewProfile(
            editor.form.getValues(),
            profile,
            locale,
            tFeatures,
            t('previewName'),
          )}
        />
      }
    >
      <PublicProfileEditorPanel title={t('fields.mainInfo')}>
        <Box sx={styles.mainFields}>
          <RhfTextField
            control={control}
            name="headline"
            label={t('fields.headline')}
            disabled={disabled}
            sx={styles.fullRow}
          />
          <RhfTextField
            control={control}
            name="displayName"
            label={t('fields.displayName')}
            disabled={disabled}
          />
          <RhfTextField
            control={control}
            name="legalCreci"
            label={t('fields.legalCreci')}
            disabled={disabled}
          />
          <RhfTextField
            control={control}
            name="headquarters"
            label={t('fields.headquarters')}
            disabled={disabled}
          />
          <RhfTextField
            control={control}
            name="address"
            label={t('fields.address')}
            disabled={disabled}
          />
          <RhfMaskedTextField
            control={control}
            name="phone"
            label={t('fields.phone')}
            mask={phoneMask}
            type="tel"
            autoComplete="tel"
            InputProps={{ readOnly: disabled }}
          />
          <RhfTextField
            control={control}
            name="email"
            label={t('fields.email')}
            disabled={disabled}
          />
          <RhfTextField
            control={control}
            name="coverage"
            label={t('fields.coverage')}
            helperText={t('fields.commaSeparatedHint')}
            disabled={disabled}
          />
          <RhfTextField
            control={control}
            name="segments"
            label={t('fields.segments')}
            helperText={t('fields.commaSeparatedHint')}
            disabled={disabled}
          />
          <RhfTextField
            control={control}
            name="yearsInMarket"
            label={t('fields.yearsInMarket')}
            disabled={disabled}
          />
          <RhfTextField
            control={control}
            name="summary"
            label={t('fields.summary')}
            multiline
            minRows={6}
            fullWidth
            disabled={disabled}
            sx={styles.longText}
          />
        </Box>
      </PublicProfileEditorPanel>
      <Stack spacing={2}>
        <PublicProfileEditorPanel title={t('fields.appearance')}>
          <Box sx={styles.colorFields}>
            <RhfTextField
              control={control}
              name="backgroundColor"
              label={t('fields.backgroundColor')}
              type="color"
              disabled={disabled}
            />
          </Box>
        </PublicProfileEditorPanel>
        <PublicProfileEditorPanel title={t('fields.images')}>
          <Box sx={styles.imageFields}>
            <SingleImageUploadField
              control={control}
              name="logoUrl"
              label={t('fields.logoUrl')}
              target="agency-logo"
              variant="avatar"
              disabled={disabled}
            />
            <SingleImageUploadField
              control={control}
              name="bannerUrl"
              label={t('fields.bannerUrl')}
              target="agency-banner"
              variant="banner"
              disabled={disabled}
            />
          </Box>
        </PublicProfileEditorPanel>
      </Stack>
      <PublicProfileEditorPanel title={t('fields.team')} fullRow>
        <Controller
          control={control}
          name="team"
          render={({ field, fieldState }) => (
            <Autocomplete
              multiple
              disabled={disabled}
              options={tenantAgents ?? []}
              value={(tenantAgents ?? []).filter((agent) =>
                field.value.some((member) => member.userId === agent.id),
              )}
              getOptionLabel={(agent) => agent.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              slotProps={teamPickerSlotProps}
              onChange={(_event, selected) =>
                field.onChange(
                  selected.slice(0, 6).map((agent) => ({ userId: agent.id, name: agent.name })),
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
      </PublicProfileEditorPanel>
    </PublicProfileEditorShell>
  )
}
