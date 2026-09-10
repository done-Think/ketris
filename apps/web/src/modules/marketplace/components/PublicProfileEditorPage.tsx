'use client'

import { useCallback, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDropzone } from 'react-dropzone'
import { Box, Stack, Typography } from '@mui/material'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { useTranslations } from 'next-intl'

import { brand, iconSize } from '@shared/theme/tokens'

import {
  PublicProfileAppearanceFields,
  PublicProfileEditorActions,
  PublicProfileImageFields,
  PublicProfileMainFields,
  PublicProfileTeamFields,
} from './public-profile-editor/PublicProfileEditorFormSections'
import { PublicProfileDemonstrative } from './public-profile-editor/PublicProfileDemonstrative'
import { PublicProfileOrderPanel } from './public-profile-editor/PublicProfileOrderPanel'
import { PublicProfileSectionPreviewDialog } from './public-profile-editor/PublicProfilePreviewDialog'
import { isPublicProfileSectionKey } from './public-profile-editor/public-profile-editor-shared'
import { publicProfileEditorDefaultValues } from '../data/public-profile-editor'
import { useProfileEditorImageUpload } from '../hooks/use-profile-editor-image-upload'
import { useProfileEditorSectionOrder } from '../hooks/use-profile-editor-section-order'
import { publicProfileEditorSchema } from '../schemas/public-profile-editor-schema'
import type {
  PublicProfileEditorFormValues,
  PublicProfileImageFieldName,
} from '../types/public-profile-editor'

export function PublicProfileEditorPage() {
  const t = useTranslations('marketplace.profileEditor')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const {
    control,
    formState: { isSubmitSuccessful },
    handleSubmit,
    setValue,
    watch,
  } = useForm<PublicProfileEditorFormValues>({
    defaultValues: publicProfileEditorDefaultValues,
    resolver: zodResolver(publicProfileEditorSchema),
  })
  const {
    append: appendTeamMember,
    fields: teamFields,
    remove: removeTeamMember,
  } = useFieldArray({
    control,
    name: 'teamMembers',
  })
  const profileDraft = watch()
  const visibleSectionOrder = profileDraft.sectionOrder.filter(isPublicProfileSectionKey)
  const setSectionOrder = useCallback(
    (sectionOrder: PublicProfileEditorFormValues['sectionOrder']) => {
      setValue('sectionOrder', sectionOrder, { shouldDirty: true, shouldValidate: true })
    },
    [setValue],
  )
  const {
    draggedPosition,
    finishLongPress,
    isTouchLikeDevice,
    moveLongPress,
    pressedPosition,
    resetLongPress,
    setDraggedPosition,
    startLongPress,
    swapSectionPositions,
    updateSectionOrder,
  } = useProfileEditorSectionOrder({
    sectionOrder: profileDraft.sectionOrder,
    setSectionOrder,
  })
  const setImageValue = useCallback(
    (fieldName: PublicProfileImageFieldName, previewUrl: string) => {
      setValue(fieldName, previewUrl, { shouldDirty: true, shouldValidate: true })
    },
    [setValue],
  )
  const { updateImageFromFile } = useProfileEditorImageUpload({ setImageValue })

  const avatarDropzone = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    multiple: false,
    onDrop: (acceptedFiles) => updateImageFromFile('avatarUrl', acceptedFiles),
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
      <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto' }}>
        <Stack
          direction="column"
          justifyContent="center"
          alignItems="center"
          spacing={2}
          sx={{ mb: 2.6, textAlign: 'center' }}
        >
          <Box sx={{ width: '100%' }}>
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
          component="form"
          onSubmit={handleSubmit(handleStaticSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}
        >
          <Stack spacing={2} sx={{ width: '100%', maxWidth: 920, mx: 'auto' }}>
            <PublicProfileMainFields control={control} />
            <PublicProfileTeamFields
              appendTeamMember={appendTeamMember}
              control={control}
              removeTeamMember={removeTeamMember}
              teamFields={teamFields}
            />
            <PublicProfileAppearanceFields control={control} />
            <PublicProfileImageFields
              control={control}
              imageFields={[
                {
                  fieldName: 'avatarUrl',
                  label: t('fields.photoUrl'),
                  uploadLabel: t('fields.uploadPhoto'),
                  dropzone: avatarDropzone,
                  previewVariant: 'avatar',
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
            <PublicProfileEditorActions onPreview={() => setIsPreviewOpen(true)} />
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 390px' },
              gap: 2,
              alignItems: 'start',
            }}
          >
            <PublicProfileDemonstrative
              draggedPosition={draggedPosition}
              finishLongPress={finishLongPress}
              isTouchLikeDevice={isTouchLikeDevice}
              moveLongPress={moveLongPress}
              pressedPosition={pressedPosition}
              profileDraft={profileDraft}
              resetLongPress={resetLongPress}
              setDraggedPosition={setDraggedPosition}
              startLongPress={startLongPress}
              swapSectionPositions={swapSectionPositions}
              visibleSectionOrder={visibleSectionOrder}
            />
            <PublicProfileOrderPanel
              control={control}
              draggedPosition={draggedPosition}
              finishLongPress={finishLongPress}
              isTouchLikeDevice={isTouchLikeDevice}
              moveLongPress={moveLongPress}
              pressedPosition={pressedPosition}
              profileDraft={profileDraft}
              resetLongPress={resetLongPress}
              setDraggedPosition={setDraggedPosition}
              startLongPress={startLongPress}
              swapSectionPositions={swapSectionPositions}
              updateSectionOrder={updateSectionOrder}
            />
          </Box>
        </Box>
      </Box>

      <PublicProfileSectionPreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        profileDraft={profileDraft}
        visibleSectionOrder={visibleSectionOrder}
      />
    </Box>
  )
}
