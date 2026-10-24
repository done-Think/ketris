import { styles, getDropzoneStyles } from '../styles/property-media-upload-field.styles'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Box, CircularProgress, IconButton, Stack, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import { Controller } from 'react-hook-form'
import { useSnackbar } from 'notistack'
import { useTranslations } from 'next-intl'

import { iconSize } from '@shared/theme/tokens'

import { useUploadPropertyMediaBatch } from '../hooks/use-properties'
import type {
  PropertyMediaUploadFieldProps,
  PropertyMediaDropzoneProps,
} from '../types/dashboard-property'

const ACCEPTED_TYPES = { 'image/jpeg': [], 'image/png': [], 'image/webp': [] }

export function PropertyMediaUploadField({ control }: PropertyMediaUploadFieldProps) {
  const t = useTranslations('properties.create')
  const { enqueueSnackbar } = useSnackbar()
  const { mutateAsync: uploadMedia, isPending } = useUploadPropertyMediaBatch()

  return (
    <Controller
      control={control}
      name="media"
      render={({ field }) => {
        const items = field.value

        return (
          <MediaDropzone
            items={items}
            isUploading={isPending}
            onDrop={async (files) => {
              if (isPending || files.length === 0) return
              const baseItems = field.value
              const results = await uploadMedia(files)
              const uploaded = results.flatMap((result) =>
                result.status === 'fulfilled' ? [result.value] : [],
              )

              results.forEach((result, index) => {
                if (result.status === 'rejected')
                  enqueueSnackbar(t('mediaUploadFileError', { filename: files[index].name }), {
                    variant: 'error',
                  })
              })

              if (uploaded.length > 0) {
                field.onChange([
                  ...baseItems,
                  ...uploaded.map((item, index) => ({ ...item, order: baseItems.length + index })),
                ])
              }
            }}
            onRemove={(index) => {
              field.onChange(items.filter((_, itemIndex) => itemIndex !== index))
            }}
          />
        )
      }}
    />
  )
}

function MediaDropzone({ items, isUploading, onDrop, onRemove }: PropertyMediaDropzoneProps) {
  const t = useTranslations('properties.create')
  const handleDrop = useCallback((acceptedFiles: File[]) => onDrop(acceptedFiles), [onDrop])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    disabled: isUploading,
    onDrop: handleDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
  })

  return (
    <Stack spacing={2}>
      <Box {...getRootProps()} sx={getDropzoneStyles(isDragActive)}>
        <input {...getInputProps({ disabled: isUploading })} />
        <Stack spacing={0.8} alignItems="center">
          {isUploading ? (
            <CircularProgress size={iconSize.xl} />
          ) : (
            <CloudUploadOutlinedIcon sx={styles.cloudUploadOutlinedIcon} />
          )}
          <Typography sx={styles.typography}>
            {isUploading ? t('mediaUploading') : t('mediaDropzone')}
          </Typography>
        </Stack>
      </Box>

      {items.length > 0 ? (
        <Box sx={styles.box}>
          {items.map((item, index) => (
            <Box key={`${item.url}-${index}`} sx={styles.box2}>
              <Box component="img" src={item.url} alt="" sx={styles.box3} />
              <IconButton
                aria-label={t('mediaRemove')}
                onClick={() => onRemove(index)}
                size="small"
                disabled={isUploading}
                sx={styles.iconButton}
              >
                <CloseRoundedIcon sx={styles.closeRoundedIcon} />
              </IconButton>
            </Box>
          ))}
        </Box>
      ) : null}
    </Stack>
  )
}
