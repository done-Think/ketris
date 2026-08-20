'use client'

import { Box, Dialog, IconButton, Stack, Typography } from '@mui/material'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

import { alpha, radius, surface } from '@shared/theme/tokens'

import type { PropertyPhotoDialogProps } from '../../types/property-detail'

export function PropertyPhotoDialog({
  activePhotoIndex,
  onClose,
  onNextPhoto,
  onPreviousPhoto,
  onSelectPhoto,
  open,
  property,
}: PropertyPhotoDialogProps) {
  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') onPreviousPhoto()
        if (event.key === 'ArrowRight') onNextPhoto()
      }}
      PaperProps={{
        sx: {
          bgcolor: surface.darkDeep,
          color: surface.lightText,
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr) auto',
          height: '100vh',
          px: { xs: 1.5, md: 3 },
          py: { xs: 1.5, md: 2.5 },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
            {activePhotoIndex + 1} de {property.gallery.length}
          </Typography>
          <IconButton
            aria-label="Fechar galeria"
            onClick={onClose}
            sx={{ color: surface.lightText }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Box
          sx={{
            position: 'relative',
            display: 'grid',
            placeItems: 'center',
            minHeight: 0,
          }}
        >
          <Box
            component="img"
            src={property.gallery[activePhotoIndex]}
            alt={`${property.title} - foto ${activePhotoIndex + 1}`}
            sx={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: `${radius.sm}px`,
            }}
          />

          <IconButton
            aria-label="Foto anterior"
            onClick={onPreviousPhoto}
            sx={{
              position: 'absolute',
              left: { xs: 0, md: 12 },
              width: { xs: 42, md: 52 },
              height: { xs: 42, md: 52 },
              bgcolor: alpha.white[8],
              color: surface.lightText,
              '&:hover': {
                bgcolor: alpha.white[50],
              },
            }}
          >
            <ChevronLeftRoundedIcon sx={{ fontSize: { xs: 30, md: 38 } }} />
          </IconButton>

          <IconButton
            aria-label="Próxima foto"
            onClick={onNextPhoto}
            sx={{
              position: 'absolute',
              right: { xs: 0, md: 12 },
              width: { xs: 42, md: 52 },
              height: { xs: 42, md: 52 },
              bgcolor: alpha.white[8],
              color: surface.lightText,
              '&:hover': {
                bgcolor: alpha.white[50],
              },
            }}
          >
            <ChevronRightRoundedIcon sx={{ fontSize: { xs: 30, md: 38 } }} />
          </IconButton>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            overflowX: 'auto',
            py: 1,
            px: { xs: 0, md: 6 },
          }}
        >
          {property.gallery.map((image, index) => (
            <Box
              component="button"
              type="button"
              key={image}
              aria-label={`Ver foto ${index + 1}`}
              onClick={() => onSelectPhoto(index)}
              sx={{
                flex: '0 0 auto',
                width: { xs: 72, md: 96 },
                height: { xs: 52, md: 68 },
                borderRadius: `${radius.sm}px`,
                border: '2px solid',
                borderColor: index === activePhotoIndex ? 'primary.main' : 'transparent',
                backgroundImage: `url("${image}")`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                cursor: 'pointer',
                opacity: index === activePhotoIndex ? 1 : 0.62,
                p: 0,
              }}
            />
          ))}
        </Stack>
      </Box>
    </Dialog>
  )
}
