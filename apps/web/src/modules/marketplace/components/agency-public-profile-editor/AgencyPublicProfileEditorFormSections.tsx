import { Box, Button, Stack, Typography } from '@mui/material'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useTranslations } from 'next-intl'

import { RhfTextField } from '@shared/components/form'
import { alpha, iconSize, motion, radius, surface } from '@shared/theme/tokens'

import type {
  AgencyPublicProfileEditorActionsProps,
  AgencyPublicProfileImageFieldConfig,
  AgencyPublicProfileImageFieldsProps,
  AgencyPublicProfileMainFieldsProps,
} from '../../types/agency-public-profile-editor'
import { agencyEditorPanelSx } from './agency-public-profile-editor-shared'

export function AgencyPublicProfileMainFields({ control }: AgencyPublicProfileMainFieldsProps) {
  const t = useTranslations('marketplace.agencyProfileEditor')

  return (
    <Box sx={agencyEditorPanelSx}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('mainContent')}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 1.6,
        }}
      >
        <RhfTextField
          control={control}
          name="displayName"
          label={t('fields.displayName')}
          fullWidth
        />
        <RhfTextField control={control} name="headline" label={t('fields.headline')} fullWidth />
        <RhfTextField
          control={control}
          name="legalCreci"
          label={t('fields.legalCreci')}
          fullWidth
        />
        <RhfTextField
          control={control}
          name="headquarters"
          label={t('fields.headquarters')}
          fullWidth
        />
        <RhfTextField control={control} name="address" label={t('fields.address')} fullWidth />
        <RhfTextField control={control} name="coverage" label={t('fields.coverage')} fullWidth />
        <RhfTextField
          control={control}
          name="segments"
          label={t('fields.segments')}
          fullWidth
          sx={{ gridColumn: { md: '1 / -1' } }}
        />
        <RhfTextField
          control={control}
          name="summary"
          label={t('fields.summary')}
          multiline
          minRows={4}
          fullWidth
          sx={{ gridColumn: { md: '1 / -1' } }}
        />
      </Box>
    </Box>
  )
}

export function AgencyPublicProfileAppearanceFields({
  control,
}: AgencyPublicProfileMainFieldsProps) {
  const t = useTranslations('marketplace.agencyProfileEditor')

  return (
    <Box sx={agencyEditorPanelSx}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('appearance')}
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
          fullWidth
        />
        <RhfTextField
          control={control}
          name="accentColor"
          label={t('fields.accentColor')}
          type="color"
          fullWidth
        />
        <RhfTextField
          control={control}
          name="backgroundColor"
          label={t('fields.backgroundColor')}
          type="color"
          fullWidth
        />
      </Box>
    </Box>
  )
}

function AgencyPublicProfileImageField({
  control,
  dropzone,
  fieldName,
  label,
  previewVariant,
  profileDraft,
  uploadLabel,
}: AgencyPublicProfileImageFieldConfig &
  Pick<AgencyPublicProfileImageFieldsProps, 'control' | 'profileDraft'>) {
  const t = useTranslations('marketplace.agencyProfileEditor')
  const imageUrl = profileDraft[fieldName]

  return (
    <Stack spacing={1.2}>
      <RhfTextField control={control} name={fieldName} label={label} fullWidth />
      <Box
        {...dropzone.getRootProps()}
        sx={{
          border: '1px dashed',
          borderColor: dropzone.isDragActive ? profileDraft.primaryColor : alpha.graphite[18],
          borderRadius: `${radius.sm}px`,
          bgcolor: dropzone.isDragActive ? alpha.magenta[8] : surface.app,
          cursor: 'pointer',
          p: 1.4,
          transition: motion.transition.bordered,
        }}
      >
        <input {...dropzone.getInputProps()} aria-label={uploadLabel} />
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            aria-label={previewVariant === 'logo' ? t('logoPreview') : t('bannerPreview')}
            sx={{
              width: previewVariant === 'logo' ? 116 : 104,
              height: 58,
              borderRadius: `${radius.sm}px`,
              bgcolor: alpha.graphite[8],
              backgroundImage: `url("${imageUrl}")`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: previewVariant === 'logo' ? 'contain' : 'cover',
              flex: '0 0 auto',
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <UploadFileOutlinedIcon sx={{ color: profileDraft.primaryColor, fontSize: 20 }} />
              <Typography sx={{ color: surface.darkText, fontSize: 13, fontWeight: 900 }}>
                {dropzone.isDragActive ? t('dropImage') : uploadLabel}
              </Typography>
            </Stack>
            <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
              {t('uploadHelper')}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Stack>
  )
}

export function AgencyPublicProfileImageFields({
  control,
  imageFields,
  profileDraft,
}: AgencyPublicProfileImageFieldsProps) {
  const t = useTranslations('marketplace.agencyProfileEditor')

  return (
    <Box sx={agencyEditorPanelSx}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('brandImages')}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 1.6,
        }}
      >
        {imageFields.map((imageField) => (
          <AgencyPublicProfileImageField
            key={imageField.fieldName}
            {...imageField}
            control={control}
            profileDraft={profileDraft}
          />
        ))}
      </Box>
    </Box>
  )
}

export function AgencyPublicProfileEditorActions({
  onPreview,
}: AgencyPublicProfileEditorActionsProps) {
  const t = useTranslations('marketplace.agencyProfileEditor')

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <Button
        type="submit"
        variant="contained"
        startIcon={<SaveOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
        sx={{ minHeight: 44, borderRadius: `${radius.sm}px`, flex: 1 }}
      >
        {t('saveDraft')}
      </Button>
      <Button
        type="button"
        variant="outlined"
        color="secondary"
        startIcon={<VisibilityOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
        onClick={onPreview}
        sx={{ minHeight: 44, borderRadius: `${radius.sm}px`, flex: 1 }}
      >
        {t('preview')}
      </Button>
    </Stack>
  )
}
