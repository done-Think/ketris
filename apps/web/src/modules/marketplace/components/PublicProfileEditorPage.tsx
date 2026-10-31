'use client'

import { Box, Stack } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'

import type { AppLocale } from '@/i18n/types/locale.types'
import { RhfTextField } from '@shared/components/form'

import {
  useOwnBrokerProfile,
  usePublishBrokerProfile,
  useSaveBrokerProfile,
  useUnpublishBrokerProfile,
} from '../hooks/use-broker-profile'
import { usePublicProfileEditor } from '../hooks/use-public-profile-editor'
import { createPublicProfileEditorSchema } from '../schemas/public-profile-editor-schema'
import { styles } from '../styles/public-profile-editor.styles'
import type { BrokerProfileEditorProps } from '../types/profile-editor'
import { toDraft, toFormValues, toPreviewProfile } from '../utils/public-profile-editor-adapter'
import { BrokerPublicProfilePage } from './BrokerPublicProfilePage'
import { PublicProfileEditorLoader } from './public-profile-editor/PublicProfileEditorLoader'
import { PublicProfileEditorPanel } from './public-profile-editor/PublicProfileEditorPanel'
import { PublicProfileEditorShell } from './public-profile-editor/PublicProfileEditorShell'
import { SingleImageUploadField } from './public-profile-editor/SingleImageUploadField'
import { PublicProfileAddressPanel } from './public-profile-editor/PublicProfileAddressPanel'

const formId = 'broker-public-profile-editor-form'

export function PublicProfileEditorPage() {
  const t = useTranslations('marketplace.profileEditor')
  const profileQuery = useOwnBrokerProfile()

  return (
    <PublicProfileEditorLoader
      isPending={profileQuery.isPending}
      isError={profileQuery.isError}
      errorLabel={t('loadError')}
      retryLabel={t('retry')}
      onRetry={() => void profileQuery.refetch()}
    >
      <BrokerProfileEditor
        key={profileQuery.data?.id ?? 'new'}
        profile={profileQuery.data ?? null}
      />
    </PublicProfileEditorLoader>
  )
}

function BrokerProfileEditor({ profile }: BrokerProfileEditorProps) {
  const locale = useLocale() as AppLocale
  const t = useTranslations('marketplace.profileEditor')
  const tFeatures = useTranslations('marketplace.propertyFeatures')
  const schemas = useMemo(
    () => ({
      draft: createPublicProfileEditorSchema((key) => t(`errors.${key}`)),
      publish: createPublicProfileEditorSchema((key) => t(`errors.${key}`), {
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
    save: useSaveBrokerProfile(),
    publish: usePublishBrokerProfile(),
    unpublish: useUnpublishBrokerProfile(),
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
        <BrokerPublicProfilePage
          broker={toPreviewProfile(
            editor.form.getValues(),
            profile,
            locale,
            tFeatures,
            t('previewName'),
          )}
        />
      }
    >
      <PublicProfileAddressPanel kind="broker" />
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
            name="creci"
            label={t('fields.creci')}
            disabled={disabled}
          />
          <RhfTextField
            control={control}
            name="phone"
            label={t('fields.phone')}
            disabled={disabled}
          />
          <RhfTextField
            control={control}
            name="region"
            label={t('fields.region')}
            disabled={disabled}
          />
          <RhfTextField
            control={control}
            name="neighborhoods"
            label={t('fields.neighborhoods')}
            helperText={t('fields.neighborhoodsHint')}
            disabled={disabled}
          />
          <RhfTextField
            control={control}
            name="specialties"
            label={t('fields.specialties')}
            helperText={t('fields.commaSeparatedHint')}
            disabled={disabled}
          />
          <RhfTextField
            control={control}
            name="availability"
            label={t('fields.availability')}
            disabled={disabled}
          />
          <RhfTextField
            control={control}
            name="bio"
            label={t('fields.bio')}
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
              name="primaryColor"
              label={t('fields.primaryColor')}
              type="color"
              disabled={disabled}
            />
            <RhfTextField
              control={control}
              name="secondaryColor"
              label={t('fields.secondaryColor')}
              type="color"
              disabled={disabled}
            />
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
              name="avatarUrl"
              label={t('fields.photoUrl')}
              target="broker-avatar"
              variant="avatar"
              disabled={disabled}
            />
            <SingleImageUploadField
              control={control}
              name="bannerUrl"
              label={t('fields.bannerUrl')}
              target="broker-banner"
              variant="banner"
              disabled={disabled}
            />
          </Box>
        </PublicProfileEditorPanel>
      </Stack>
    </PublicProfileEditorShell>
  )
}
