'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Avatar, Box, CircularProgress, IconButton, Stack, Typography } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import { Controller, type FieldPath, type FieldValues } from 'react-hook-form'
import { useSnackbar } from 'notistack'
import { useTranslations } from 'next-intl'

import { iconSize } from '@shared/theme/tokens'

import { useUploadProfileMedia } from '../../hooks/use-profile-media'
import type {
  ImageDropzoneProps,
  SingleImageUploadFieldProps,
} from '../../types/single-image-upload-field'
import {
  styles,
  getBoxStyles,
  getTypographyStyles,
} from '../../styles/single-image-upload-field.styles'

const ACCEPTED_TYPES = { 'image/jpeg': [], 'image/png': [], 'image/webp': [] }

export function SingleImageUploadField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  target,
  label,
  variant = 'banner',
  disabled = false,
}: SingleImageUploadFieldProps<TFieldValues, TName>) {
  const t = useTranslations('marketplace.mediaUpload')
  const { enqueueSnackbar } = useSnackbar()
  const { mutateAsync: uploadMedia, isPending } = useUploadProfileMedia()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = typeof field.value === 'string' ? field.value : ''

        async function handleDrop(files: File[]) {
          const file = files[0]

          if (!file) return

          try {
            const url = await uploadMedia({ file, target })

            field.onChange(url)
          } catch {
            enqueueSnackbar(t('uploadError'), { variant: 'error' })
          }
        }

        return (
          <ImageDropzone
            label={label}
            value={value}
            isUploading={isPending}
            variant={variant}
            disabled={disabled}
            error={fieldState.error?.message}
            onDrop={handleDrop}
            onRemove={() => field.onChange('')}
          />
        )
      }}
    />
  )
}

function ImageDropzone({
  label,
  value,
  isUploading,
  variant,
  disabled,
  error,
  onDrop,
  onRemove,
}: ImageDropzoneProps) {
  const t = useTranslations('marketplace.mediaUpload')
  const handleDrop = useCallback((acceptedFiles: File[]) => onDrop(acceptedFiles), [onDrop])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: ACCEPTED_TYPES,
    multiple: false,
    disabled,
  })

  return (
    <Stack spacing={1}>
      <Typography sx={styles.typography}>{label}</Typography>
      <Stack direction="row" spacing={1.6} alignItems="center">
        {value ? (
          variant === 'avatar' ? (
            <Avatar src={value} alt="" sx={styles.avatar} />
          ) : (
            <Box component="img" src={value} alt="" sx={styles.box} />
          )
        ) : null}

        <Box {...getRootProps()} sx={getBoxStyles({ error, isDragActive, disabled })}>
          <input {...getInputProps()} aria-label={label} />
          <Stack direction="row" spacing={0.8} alignItems="center">
            {isUploading ? (
              <CircularProgress size={iconSize.md} />
            ) : (
              <CloudUploadOutlinedIcon sx={styles.cloudUploadOutlinedIcon} />
            )}
            <Typography sx={styles.typography2}>
              {isUploading ? t('uploading') : isDragActive ? t('dragActive') : t('dropzone')}
            </Typography>
          </Stack>
        </Box>

        {value ? (
          <IconButton aria-label={t('remove')} onClick={onRemove} size="small" disabled={disabled}>
            <CloseRoundedIcon sx={styles.closeRoundedIcon} />
          </IconButton>
        ) : null}
      </Stack>
      <Typography sx={getTypographyStyles({ error })}>{error ?? t('hint')}</Typography>
    </Stack>
  )
}
