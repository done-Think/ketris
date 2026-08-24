import { Avatar, Box, Button, Stack, Typography } from '@mui/material'
import Link from 'next/link'

import { alpha, componentText, radius, surface } from '@shared/theme/tokens'

import type { PublicProfileMiniSectionProps } from '../../types/public-profile-editor'

const previewMetrics = [
  { label: 'Nota', value: '4.9' },
  { label: 'Tempo médio', value: '15 min' },
  { label: 'Imóveis', value: '42' },
  { label: 'Fechados', value: '128' },
] as const

const previewListings = ['Apartamento Jardins', 'Garden Remodelado', 'Cobertura Duplex'] as const

export function PublicProfileMiniSection({
  profileDraft,
  sectionKey,
}: PublicProfileMiniSectionProps) {
  if (sectionKey === 'hero') {
    return (
      <Box
        sx={{
          border: '1px solid',
          borderColor: alpha.graphite[8],
          borderRadius: `${radius.sm}px`,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            minHeight: { xs: 190, md: 260 },
            backgroundImage: `linear-gradient(90deg, ${alpha.graphite[52]}, ${alpha.graphite[18]}), url("${profileDraft.bannerUrl}")`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            display: 'grid',
            alignItems: 'end',
            p: { xs: 1.6, md: 2 },
          }}
        >
          <Typography
            sx={{
              color: surface.lightText,
              fontSize: { xs: 22, md: 32 },
              fontWeight: 900,
              lineHeight: 1.12,
            }}
          >
            {profileDraft.headline}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ p: 1.6 }}>
          <Avatar
            src={profileDraft.avatarUrl}
            alt={profileDraft.displayName}
            sx={{
              width: 76,
              height: 76,
              boxShadow: `0 0 0 4px ${profileDraft.primaryColor}`,
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: surface.darkText, fontSize: 26, fontWeight: 900 }}>
              {profileDraft.displayName}
            </Typography>
            <Typography sx={{ color: 'text.secondary', ...componentText.cardMeta }}>
              Perfil público configurável
            </Typography>
          </Box>
        </Stack>
      </Box>
    )
  }

  if (sectionKey === 'metrics') {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, 1fr)' },
          gap: 0.8,
        }}
      >
        {previewMetrics.map((metric) => (
          <Box
            key={metric.label}
            sx={{
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              p: 1,
            }}
          >
            <Typography sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 800 }}>
              {metric.label}
            </Typography>
            <Typography sx={{ color: profileDraft.primaryColor, fontSize: 18, fontWeight: 900 }}>
              {metric.value}
            </Typography>
          </Box>
        ))}
      </Box>
    )
  }

  if (sectionKey === 'team') {
    if (profileDraft.teamMembers.length === 0) {
      return (
        <Box
          sx={{
            border: '1px dashed',
            borderColor: alpha.graphite[18],
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            p: 1.5,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>
            Nenhum membro adicionado.
          </Typography>
        </Box>
      )
    }

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          gap: 0.8,
        }}
      >
        {profileDraft.teamMembers.map((member) => (
          <Stack
            key={`${member.profileUrl}-${member.name}`}
            component={Link}
            href={member.profileUrl}
            direction="row"
            spacing={0.8}
            alignItems="center"
            sx={{
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              color: 'inherit',
              p: 1,
              textDecoration: 'none',
            }}
          >
            <Avatar src={member.avatarUrl} alt={member.name} sx={{ width: 34, height: 34 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 12, fontWeight: 900 }}>
                {member.name}
              </Typography>
              <Typography noWrap sx={{ color: 'text.secondary', fontSize: 10 }}>
                {member.role}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Box>
    )
  }

  if (sectionKey === 'listings') {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          gap: 0.8,
        }}
      >
        {previewListings.map((title) => (
          <Box
            key={title}
            sx={{
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                height: 104,
                backgroundImage: `url("${profileDraft.bannerUrl}")`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
              }}
            />
            <Box sx={{ p: 1 }}>
              <Typography noWrap sx={{ fontSize: 12, fontWeight: 900 }}>
                {title}
              </Typography>
              <Typography sx={{ color: profileDraft.primaryColor, fontSize: 13, fontWeight: 900 }}>
                R$ 4.800 / mês
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={0.8}
      sx={{
        border: '1px solid',
        borderColor: alpha.graphite[8],
        borderRadius: `${radius.sm}px`,
        bgcolor: surface.paper,
        p: 1,
      }}
    >
      {['Ligar', 'E-mail', 'Abrir link público'].map((action, index) => (
        <Button
          key={action}
          variant={index === 0 ? 'contained' : 'outlined'}
          color={index === 0 ? 'primary' : 'secondary'}
          size="small"
          sx={{
            bgcolor: index === 0 ? profileDraft.primaryColor : undefined,
            borderRadius: `${radius.sm}px`,
            flex: 1,
          }}
        >
          {action}
        </Button>
      ))}
    </Stack>
  )
}
