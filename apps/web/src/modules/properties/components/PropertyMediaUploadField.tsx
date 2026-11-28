import { styles, getDropzoneStyles } from '../styles/property-media-upload-field.styles'
import { useCallback } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { Box, Button, CircularProgress, IconButton, Stack, Typography } from '@mui/material'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import StarOutlineRoundedIcon from '@mui/icons-material/StarOutlineRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import { Controller } from 'react-hook-form'
import { useSnackbar } from 'notistack'
import { useFormatter, useTranslations } from 'next-intl'

import { iconSize } from '@shared/theme/tokens'
import { getApiErrorCode } from '@shared/utils/error-message'

import {
  propertyMediaAcceptedTypes,
  propertyMediaMaxSizeBytes,
  propertyMediaMaxSizeMb,
  propertyMediaRejectionAutoHideMs,
} from '../config/dashboard-property-ui'
import { useUploadPropertyMediaBatch } from '../hooks/use-properties'
import type {
  PropertyMediaUploadFieldProps,
  PropertyMediaDropzoneProps,
} from '../types/dashboard-property'

export function PropertyMediaUploadField({ control }: PropertyMediaUploadFieldProps) {
  const t = useTranslations('properties.create')
  const { enqueueSnackbar } = useSnackbar()
  const format = useFormatter()
  const { mutateAsync: uploadMedia, isPending } = useUploadPropertyMediaBatch()

  const notifyRejected = (rejections: FileRejection[]) => {
    rejections.forEach(({ file, errors }) => {
      const tooLarge = errors.some((error) => error.code === 'file-too-large')
      const message = tooLarge
        ? t('mediaRejectedSize', {
            filename: file.name,
            size: format.number(file.size / 1024 / 1024, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }),
            max: propertyMediaMaxSizeMb,
          })
        : t('mediaRejectedType', { filename: file.name })
      enqueueSnackbar(message, {
        variant: 'error',
        autoHideDuration: propertyMediaRejectionAutoHideMs,
      })
    })
  }

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
            onReject={notifyRejected}
            onDrop={async (files) => {
              if (isPending || files.length === 0) return
              const baseItems = field.value
              const results = await uploadMedia(files)
              const uploaded = results.flatMap((result) =>
                result.status === 'fulfilled' ? [result.value] : [],
              )

              results.forEach((result, index) => {
                if (result.status === 'rejected')
                  enqueueSnackbar(
                    t(
                      getApiErrorCode(result.reason) === 'PROPERTY_MEDIA_STORAGE_UNAVAILABLE'
                        ? 'mediaStorageUnavailableFileError'
                        : 'mediaUploadFileError',
                      { filename: files[index].name },
                    ),
                    {
                      variant: 'error',
                    },
                  )
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
            onSelectFeatured={(index) => {
              if (isPending || index === 0) return
              field.onChange([items[index], ...items.filter((_, itemIndex) => itemIndex !== index)])
            }}
          />
        )
      }}
    />
  )
}

function MediaDropzone({
  items,
  isUploading,
  onDrop,
  onReject,
  onRemove,
  onSelectFeatured,
}: PropertyMediaDropzoneProps) {
  const t = useTranslations('properties.create')
  const handleDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) onReject(rejections)
      onDrop(acceptedFiles)
    },
    [onDrop, onReject],
  )
  const dropzone = useDropzone({
    disabled: isUploading,
    onDrop: handleDrop,
    accept: propertyMediaAcceptedTypes,
    maxSize: propertyMediaMaxSizeBytes,
    multiple: true,
  })
  const { getRootProps, getInputProps, isDragActive } = dropzone
  const isDragReject = isDragActive && dropzone.isDragReject

  return (
    <Stack spacing={2}>
      <Box {...getRootProps()} sx={getDropzoneStyles(isDragActive, isDragReject)}>
        <input {...getInputProps({ disabled: isUploading })} />
        <Stack spacing={0.8} alignItems="center">
          {isUploading ? (
            <CircularProgress size={iconSize.xl} />
          ) : (
            <CloudUploadOutlinedIcon sx={styles.cloudUploadOutlinedIcon} />
          )}
          <Typography sx={isDragReject ? styles.rejectTypography : styles.typography}>
            {isUploading
              ? t('mediaUploading')
              : isDragReject
                ? t('mediaDropzoneReject')
                : t('mediaDropzone')}
          </Typography>
          <Typography sx={isDragReject ? styles.rejectHint : styles.hint}>
            {t('mediaDropzoneHint', { max: propertyMediaMaxSizeMb })}
          </Typography>
        </Stack>
      </Box>

      {items.length > 0 ? (
        <Box sx={styles.box}>
          {items.map((item, index) => (
            <Box key={`${item.url}-${index}`} sx={styles.box2}>
              <Box
                component="img"
                src={item.url}
                alt=""
                sx={[styles.box3, index === 0 && styles.featuredImage]}
              />
              <IconButton
                aria-label={t('mediaRemove')}
                onClick={() => onRemove(index)}
                size="small"
                disabled={isUploading}
                sx={styles.iconButton}
              >
                <CloseRoundedIcon sx={styles.closeRoundedIcon} />
              </IconButton>
              <Button
                type="button"
                fullWidth
                variant={index === 0 ? 'contained' : 'outlined'}
                aria-pressed={index === 0}
                onClick={() => onSelectFeatured(index)}
                disabled={isUploading}
                startIcon={index === 0 ? <StarRoundedIcon /> : <StarOutlineRoundedIcon />}
                sx={styles.featuredButton}
              >
                {t(index === 0 ? 'mediaFeatured' : 'mediaSetFeatured')}
              </Button>
            </Box>
          ))}
        </Box>
      ) : null}
    </Stack>
  )
}
