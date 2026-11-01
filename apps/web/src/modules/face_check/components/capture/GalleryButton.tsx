'use client'

import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined'
import { Button } from '@mui/material'

import type { GalleryButtonProps } from '../../types/capture.types'
import { liveCaptureStyles as styles } from '../../styles/capture.styles'

export function GalleryButton({
  label,
  onFile,
  disabled,
  accept = 'image/jpeg,image/png,image/heic,image/heif',
}: GalleryButtonProps) {
  return (
    <Button
      component="label"
      variant="outlined"
      fullWidth
      startIcon={<PhotoLibraryOutlinedIcon />}
      disabled={disabled}
      sx={styles.galleryButton}
    >
      {label}
      <input
        hidden
        type="file"
        aria-label={label}
        disabled={disabled}
        accept={accept}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) onFile(file)
        }}
      />
    </Button>
  )
}
