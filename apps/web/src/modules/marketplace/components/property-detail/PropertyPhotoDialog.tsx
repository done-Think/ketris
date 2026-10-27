'use client'

import { Box, Dialog, IconButton, Stack, Typography } from '@mui/material'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useTranslations } from 'next-intl'

import type { PropertyPhotoDialogProps } from '../../types/property-detail'
import { styles, getBoxStyles } from '../../styles/property-photo-dialog.styles'

export function PropertyPhotoDialog({
  activePhotoIndex,
  onClose,
  onNextPhoto,
  onPreviousPhoto,
  onSelectPhoto,
  open,
  property,
}: PropertyPhotoDialogProps) {
  const t = useTranslations('marketplace.propertyDetail.gallery')

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') onPreviousPhoto()
        if (event.key === 'ArrowRight') onNextPhoto()
      }}
      slotProps={{
        paper: {
          sx: styles.paper,
        },
      }}
    >
      <Box sx={styles.box}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography sx={styles.typography}>
            {t('photoCounter', { current: activePhotoIndex + 1, total: property.gallery.length })}
          </Typography>
          <IconButton aria-label={t('closeGallery')} onClick={onClose} sx={styles.iconButton}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Box sx={styles.box2}>
          <Box
            component="img"
            src={property.gallery[activePhotoIndex]}
            alt={t('photoAlt', { title: property.title, index: activePhotoIndex + 1 })}
            sx={styles.box3}
          />

          <IconButton
            aria-label={t('previousPhoto')}
            onClick={onPreviousPhoto}
            sx={styles.iconButton2}
          >
            <ChevronLeftRoundedIcon sx={styles.chevronLeftRoundedIcon} />
          </IconButton>

          <IconButton aria-label={t('nextPhoto')} onClick={onNextPhoto} sx={styles.iconButton3}>
            <ChevronRightRoundedIcon sx={styles.chevronLeftRoundedIcon} />
          </IconButton>
        </Box>

        <Stack direction="row" spacing={1} sx={styles.stack}>
          {property.gallery.map((image, index) => (
            <Box
              component="button"
              type="button"
              key={image}
              aria-label={t('selectPhoto', { index: index + 1 })}
              onClick={() => onSelectPhoto(index)}
              sx={getBoxStyles({ index, activePhotoIndex, image })}
            />
          ))}
        </Stack>
      </Box>
    </Dialog>
  )
}
