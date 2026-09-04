'use client'

import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDropzone } from 'react-dropzone'
import { Box, Stack, Typography } from '@mui/material'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { useTranslations } from 'next-intl'

import { brand, iconSize } from '@shared/theme/tokens'

import {
  AgencyPublicProfileAppearanceFields,
  AgencyPublicProfileEditorActions,
  AgencyPublicProfileImageFields,
  AgencyPublicProfileMainFields,
} from './agency-public-profile-editor/AgencyPublicProfileEditorFormSections'
import { AgencyPublicProfilePreviewDialog } from './agency-public-profile-editor/AgencyPublicProfilePreviewDialog'
import { isAgencyPublicProfileSectionKey } from './agency-public-profile-editor/agency-public-profile-editor-shared'
import { agencyPublicProfileEditorDefaultValues } from '../data/agency-public-profile-editor'
import { useProfileEditorImageUpload } from '../hooks/use-profile-editor-image-upload'
import { agencyPublicProfileEditorSchema } from '../schemas/agency-public-profile-editor-schema'
import type {
  AgencyPublicProfileEditorFormValues,
  AgencyPublicProfileImageFieldName,
} from '../types/agency-public-profile-editor'

export function AgencyPublicProfileEditorPage() {
  const t = useTranslations('marketplace.agencyProfileEditor')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const {
    control,
    formState: { isSubmitSuccessful },
    handleSubmit,
    setValue,
    watch,
  } = useForm<AgencyPublicProfileEditorFormValues>({
    defaultValues: agencyPublicProfileEditorDefaultValues,
    resolver: zodResolver(agencyPublicProfileEditorSchema),
  })
  const profileDraft = watch()
  const visibleSectionOrder = profileDraft.sectionOrder.filter(isAgencyPublicProfileSectionKey)
  const setImageValue = useCallback(
    (fieldName: AgencyPublicProfileImageFieldName, previewUrl: string) => {
      setValue(fieldName, previewUrl, { shouldDirty: true, shouldValidate: true })
    },
    [setValue],
  )
  const { updateImageFromFile } = useProfileEditorImageUpload({ setImageValue })

  const logoDropzone = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.svg'] },
    maxFiles: 1,
    multiple: false,
    onDrop: (acceptedFiles) => updateImageFromFile('logoUrl', acceptedFiles),
  })
  const bannerDropzone = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    multiple: false,
    onDrop: (acceptedFiles) => updateImageFromFile('bannerUrl', acceptedFiles),
  })

  const handleStaticSubmit = () => undefined

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Box
        component="form"
        onSubmit={handleSubmit(handleStaticSubmit)}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2.6, textAlign: 'left' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 38 }, fontWeight: 900 }}>
              {t('title')}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: { xs: 14, md: 16 }, mt: 0.5 }}>
              {t('subtitle')}
            </Typography>
          </Box>
          {isSubmitSuccessful ? (
            <Stack
              direction="row"
              spacing={0.8}
              alignItems="center"
              sx={{ color: brand.semantic.success }}
            >
              <CheckCircleOutlineRoundedIcon sx={{ fontSize: iconSize.md }} />
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{t('validatedDraft')}</Typography>
            </Stack>
          ) : null}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 3fr) minmax(420px, 2fr)' },
            gridTemplateAreas: {
              xs: '"main" "settings"',
              xl: '"main settings"',
            },
            alignItems: { xs: 'start', xl: 'stretch' },
            columnGap: { xs: 2.2, xl: 4 },
            rowGap: 2.2,
          }}
        >
          <Box
            sx={{
              gridArea: 'main',
              display: 'flex',
              '& > *': {
                flex: 1,
              },
            }}
          >
            <AgencyPublicProfileMainFields control={control} />
          </Box>
          <Stack spacing={2} sx={{ gridArea: 'settings' }}>
            <AgencyPublicProfileEditorActions onPreview={() => setIsPreviewOpen(true)} />
            <AgencyPublicProfileAppearanceFields control={control} />
            <AgencyPublicProfileImageFields
              control={control}
              imageFields={[
                {
                  fieldName: 'logoUrl',
                  label: t('fields.logoUrl'),
                  uploadLabel: t('fields.uploadLogo'),
                  dropzone: logoDropzone,
                  previewVariant: 'logo',
                },
                {
                  fieldName: 'bannerUrl',
                  label: t('fields.bannerUrl'),
                  uploadLabel: t('fields.uploadBanner'),
                  dropzone: bannerDropzone,
                  previewVariant: 'banner',
                },
              ]}
              profileDraft={profileDraft}
            />
          </Stack>
        </Box>
      </Box>

      <AgencyPublicProfilePreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        profileDraft={profileDraft}
        visibleSectionOrder={visibleSectionOrder}
      />
    </Box>
  )
}
