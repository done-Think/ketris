import { Avatar, Box, Button, Stack, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useTranslations } from 'next-intl'

import { RhfTextField } from '@shared/components/form'
import { alpha, iconSize, motion, radius, surface } from '@shared/theme/tokens'

import type {
  PublicProfileEditorActionsProps,
  PublicProfileImageFieldConfig,
  PublicProfileImageFieldsProps,
  PublicProfileMainFieldsProps,
  PublicProfileTeamFieldsProps,
} from '../../types/public-profile-editor'
import { editorPanelSx } from './public-profile-editor-shared'

export function PublicProfileMainFields({ control }: PublicProfileMainFieldsProps) {
  const t = useTranslations('marketplace.profileEditor')

  return (
    <Box sx={{ ...editorPanelSx, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('mainContent')}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gridTemplateRows: { xl: 'auto minmax(0, 1fr)' },
          gap: 1.6,
          flex: 1,
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
          name="summary"
          label={t('fields.summary')}
          multiline
          minRows={6}
          fullWidth
          sx={{
            gridColumn: { md: '1 / -1' },
            '& .MuiInputBase-root': {
              alignItems: 'flex-start',
              height: { xl: '100%' },
            },
            '& textarea': {
              height: { xl: '100% !important' },
            },
          }}
        />
      </Box>
    </Box>
  )
}

export function PublicProfileAppearanceFields({ control }: PublicProfileMainFieldsProps) {
  const t = useTranslations('marketplace.profileEditor')

  return (
    <Box sx={editorPanelSx}>
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

function PublicProfileImageField({
  dropzone,
  fieldName,
  label,
  previewVariant,
  profileDraft,
  uploadLabel,
  control,
}: PublicProfileImageFieldConfig &
  Pick<PublicProfileImageFieldsProps, 'control' | 'profileDraft'>) {
  const t = useTranslations('marketplace.profileEditor')
  const imageUrl = profileDraft[fieldName]

  return (
    <Stack spacing={1.2} sx={{ height: '100%' }}>
      <RhfTextField control={control} name={fieldName} label={label} fullWidth />
      <Box
        {...dropzone.getRootProps()}
        sx={{
          minHeight: 86,
          height: '100%',
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
        <Stack
          direction="row"
          spacing={1.2}
          alignItems="center"
          justifyContent="center"
          sx={{ height: '100%' }}
        >
          {previewVariant === 'avatar' ? (
            <Avatar
              src={imageUrl}
              alt={t('photoPreview')}
              sx={{
                width: 58,
                height: 58,
                boxShadow: `0 0 0 3px ${profileDraft.primaryColor}`,
              }}
            />
          ) : (
            <Box
              aria-label={t('bannerPreview')}
              sx={{
                width: 104,
                height: 58,
                borderRadius: `${radius.sm}px`,
                bgcolor: alpha.graphite[8],
                backgroundImage: `url("${imageUrl}")`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                flex: '0 0 auto',
              }}
            />
          )}
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

export function PublicProfileImageFields({
  control,
  imageFields,
  profileDraft,
}: PublicProfileImageFieldsProps) {
  const t = useTranslations('marketplace.profileEditor')

  return (
    <Box sx={editorPanelSx}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('images')}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          alignItems: 'stretch',
          gap: 1.6,
        }}
      >
        {imageFields.map((imageField) => (
          <PublicProfileImageField
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

export function PublicProfileTeamFields({
  appendTeamMember,
  control,
  removeTeamMember,
  teamFields,
}: PublicProfileTeamFieldsProps) {
  const t = useTranslations('marketplace.profileEditor')

  return (
    <Box sx={editorPanelSx}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5">{t('team')}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.4 }}>
            {t('teamDescription')}
          </Typography>
        </Box>
        <Button
          type="button"
          variant="outlined"
          color="secondary"
          startIcon={<AddRoundedIcon sx={{ fontSize: iconSize.sm }} />}
          onClick={() =>
            appendTeamMember({
              name: '',
              role: '',
              avatarUrl: '',
              profileUrl: '',
            })
          }
          sx={{ borderRadius: `${radius.sm}px`, whiteSpace: 'nowrap' }}
        >
          {t('addMember')}
        </Button>
      </Stack>

      <Stack spacing={1.4}>
        {teamFields.map((field, index) => (
          <Box
            key={field.id}
            sx={{
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.app,
              p: 1.5,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              justifyContent="space-between"
              spacing={1}
              sx={{ mb: 1.4 }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 900 }}>
                {t('memberTitle', { index: index + 1 })}
              </Typography>
              <Button
                type="button"
                variant="text"
                color="secondary"
                startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: iconSize.sm }} />}
                onClick={() => removeTeamMember(index)}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              >
                {t('removeMember')}
              </Button>
            </Stack>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 1.4,
              }}
            >
              <RhfTextField
                control={control}
                name={`teamMembers.${index}.name`}
                label={t('fields.name')}
                fullWidth
              />
              <RhfTextField
                control={control}
                name={`teamMembers.${index}.role`}
                label={t('fields.role')}
                fullWidth
              />
              <RhfTextField
                control={control}
                name={`teamMembers.${index}.profileUrl`}
                label={t('fields.profileUrl')}
                fullWidth
              />
              <RhfTextField
                control={control}
                name={`teamMembers.${index}.avatarUrl`}
                label={t('fields.photoUrl')}
                fullWidth
              />
            </Box>
          </Box>
        ))}
        {teamFields.length === 0 ? (
          <Box
            sx={{
              border: '1px dashed',
              borderColor: alpha.graphite[18],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.app,
              p: 2,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ color: 'text.secondary', fontWeight: 800 }}>
              {t('emptyMembers')}
            </Typography>
          </Box>
        ) : null}
      </Stack>
    </Box>
  )
}

export function PublicProfileEditorActions({ onPreview }: PublicProfileEditorActionsProps) {
  const t = useTranslations('marketplace.profileEditor')

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
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
      <Button
        type="submit"
        variant="contained"
        startIcon={<SaveOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
        sx={{ minHeight: 44, borderRadius: `${radius.sm}px`, flex: 1 }}
      >
        {t('save')}
      </Button>
    </Stack>
  )
}
