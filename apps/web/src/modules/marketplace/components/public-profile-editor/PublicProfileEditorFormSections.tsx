import { Avatar, Box, Button, Stack, Typography } from '@mui/material'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

import { RhfTextField } from '@shared/components/form'
import { alpha, iconSize, motion, radius, surface } from '@shared/theme/tokens'

import type {
  PublicProfileEditorActionsProps,
  PublicProfileImageFieldConfig,
  PublicProfileImageFieldsProps,
  PublicProfileMainFieldsProps,
} from '../../types/public-profile-editor'
import { editorPanelSx } from './public-profile-editor-shared'

export function PublicProfileMainFields({ control }: PublicProfileMainFieldsProps) {
  return (
    <Box sx={editorPanelSx}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Conteúdo principal
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 1.6,
        }}
      >
        <RhfTextField control={control} name="displayName" label="Nome exibido" fullWidth />
        <RhfTextField control={control} name="headline" label="Chamada do banner" fullWidth />
        <RhfTextField
          control={control}
          name="summary"
          label="Resumo"
          multiline
          minRows={4}
          fullWidth
          sx={{ gridColumn: { md: '1 / -1' } }}
        />
      </Box>
    </Box>
  )
}

export function PublicProfileAppearanceFields({ control }: PublicProfileMainFieldsProps) {
  return (
    <Box sx={editorPanelSx}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Aparência
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
          label="Cor principal"
          type="color"
          fullWidth
        />
        <RhfTextField
          control={control}
          name="accentColor"
          label="Cor de destaque"
          type="color"
          fullWidth
        />
        <RhfTextField
          control={control}
          name="backgroundColor"
          label="Fundo do perfil"
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
          {previewVariant === 'avatar' ? (
            <Avatar
              src={imageUrl}
              alt="Prévia da foto"
              sx={{
                width: 58,
                height: 58,
                boxShadow: `0 0 0 3px ${profileDraft.primaryColor}`,
              }}
            />
          ) : (
            <Box
              aria-label="Prévia do banner"
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
                {dropzone.isDragActive ? 'Solte a imagem aqui' : uploadLabel}
              </Typography>
            </Stack>
            <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
              JPG, PNG ou WEBP. Você também pode manter apenas o link acima.
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
  return (
    <Box sx={editorPanelSx}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Imagens
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
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

export function PublicProfileEditorActions({ onPreview }: PublicProfileEditorActionsProps) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <Button
        type="submit"
        variant="contained"
        startIcon={<SaveOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
        sx={{ minHeight: 44, borderRadius: `${radius.sm}px`, flex: 1 }}
      >
        Salvar rascunho
      </Button>
      <Button
        type="button"
        variant="outlined"
        color="secondary"
        startIcon={<VisibilityOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
        onClick={onPreview}
        sx={{ minHeight: 44, borderRadius: `${radius.sm}px`, flex: 1 }}
      >
        Visualizar
      </Button>
    </Stack>
  )
}
