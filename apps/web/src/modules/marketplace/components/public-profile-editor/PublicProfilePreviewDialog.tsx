import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

import { alpha, iconSize, radius, surface } from '@shared/theme/tokens'

import type {
  PublicProfileMiniSectionProps,
  PublicProfileSectionKey,
  PublicProfileSectionPreviewDialogProps,
} from '../../types/public-profile-editor'
import { editorPanelSx, getSectionOption, sectionIcons } from './public-profile-editor-shared'

const previewMetrics = [
  { label: 'Nota', value: '4.9' },
  { label: 'Tempo médio', value: '15 min' },
  { label: 'Imóveis', value: '42' },
  { label: 'Fechados', value: '128' },
] as const

const previewTeam = ['Marina Costa', 'Juliana Mendes', 'Bianca Azevedo'] as const
const previewListings = ['Apartamento Jardins', 'Garden Remodelado', 'Cobertura Duplex'] as const

function PublicProfileDialogSection({ profileDraft, sectionKey }: PublicProfileMiniSectionProps) {
  const option = getSectionOption(sectionKey)
  const Icon = sectionIcons[sectionKey]

  if (sectionKey === 'hero') {
    return (
      <Box
        key={sectionKey}
        sx={{
          bgcolor: surface.paper,
          border: '1px solid',
          borderColor: alpha.graphite[8],
          borderRadius: `${radius.sm}px`,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            minHeight: { xs: 220, md: 300 },
            backgroundImage: `linear-gradient(90deg, ${alpha.graphite[52]}, ${alpha.graphite[18]}), url("${profileDraft.bannerUrl}")`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            display: 'grid',
            alignItems: 'end',
            p: { xs: 2, md: 3 },
          }}
        >
          <Typography
            sx={{
              color: surface.lightText,
              fontSize: { xs: 24, md: 36 },
              fontWeight: 900,
              lineHeight: 1.12,
            }}
          >
            {profileDraft.headline}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: { xs: 2, md: 2.6 } }}>
          <Avatar
            src={profileDraft.avatarUrl}
            alt={profileDraft.displayName}
            sx={{
              width: { xs: 72, md: 92 },
              height: { xs: 72, md: 92 },
              boxShadow: `0 0 0 4px ${profileDraft.primaryColor}`,
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{ color: surface.darkText, fontSize: { xs: 26, md: 34 }, fontWeight: 900 }}
            >
              {profileDraft.displayName}
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>{profileDraft.summary}</Typography>
          </Box>
        </Stack>
      </Box>
    )
  }

  if (sectionKey === 'metrics') {
    return (
      <Box key={sectionKey} sx={editorPanelSx}>
        <Typography variant="h5" sx={{ mb: 1.5 }}>
          {option?.label}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, 1fr)' },
            gap: 1,
          }}
        >
          {previewMetrics.map((metric) => (
            <Box
              key={metric.label}
              sx={{
                border: '1px solid',
                borderColor: alpha.graphite[8],
                borderRadius: `${radius.sm}px`,
                p: 1.4,
              }}
            >
              <Typography sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 800 }}>
                {metric.label}
              </Typography>
              <Typography sx={{ color: profileDraft.primaryColor, fontSize: 24, fontWeight: 900 }}>
                {metric.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    )
  }

  if (sectionKey === 'team') {
    return (
      <Box key={sectionKey} sx={editorPanelSx}>
        <Typography variant="h5" sx={{ mb: 1.5 }}>
          {option?.label}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 1,
          }}
        >
          {previewTeam.map((name, index) => (
            <Stack
              key={name}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                border: '1px solid',
                borderColor: alpha.graphite[8],
                borderRadius: `${radius.sm}px`,
                p: 1.2,
              }}
            >
              <Avatar src={profileDraft.avatarUrl} alt={name} sx={{ width: 40, height: 40 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 13, fontWeight: 900 }}>
                  {name}
                </Typography>
                <Typography noWrap sx={{ color: 'text.secondary', fontSize: 11 }}>
                  Destaque {index + 1}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Box>
      </Box>
    )
  }

  if (sectionKey === 'listings') {
    return (
      <Box key={sectionKey} sx={editorPanelSx}>
        <Typography variant="h5" sx={{ mb: 1.5 }}>
          {option?.label}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 1.2,
          }}
        >
          {previewListings.map((title) => (
            <Box
              key={title}
              sx={{
                border: '1px solid',
                borderColor: alpha.graphite[8],
                borderRadius: `${radius.sm}px`,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: 118,
                  backgroundImage: `url("${profileDraft.bannerUrl}")`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                }}
              />
              <Box sx={{ p: 1.2 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 900 }}>{title}</Typography>
                <Typography
                  sx={{ color: profileDraft.primaryColor, fontSize: 15, fontWeight: 900 }}
                >
                  R$ 4.800 / mês
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    )
  }

  return (
    <Box key={sectionKey} sx={editorPanelSx}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: radius.full,
            bgcolor: profileDraft.primaryColor,
            color: surface.lightText,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon sx={{ fontSize: iconSize.sm }} />
        </Box>
        <Typography variant="h5">{option?.label}</Typography>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
        <Button variant="contained" sx={{ bgcolor: profileDraft.primaryColor }}>
          Ligar
        </Button>
        <Button variant="outlined" color="secondary">
          E-mail
        </Button>
        <Button variant="outlined" color="secondary">
          Abrir link público
        </Button>
      </Stack>
    </Box>
  )
}

export function PublicProfileSectionPreviewDialog({
  isOpen,
  onClose,
  profileDraft,
  visibleSectionOrder,
}: PublicProfileSectionPreviewDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pr: 6 }}>
        Visualização do perfil
        <IconButton
          aria-label="Fechar visualização"
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 10 }}
        >
          <CloseRoundedIcon sx={{ fontSize: iconSize.xl }} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: surface.app }}>
        <Stack spacing={1.8}>
          {visibleSectionOrder.map((sectionKey: PublicProfileSectionKey) => (
            <PublicProfileDialogSection
              key={sectionKey}
              profileDraft={profileDraft}
              sectionKey={sectionKey}
            />
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
