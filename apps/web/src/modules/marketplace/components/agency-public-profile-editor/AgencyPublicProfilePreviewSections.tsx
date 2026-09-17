import { Avatar, Box, Button, Chip, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, radius, surface } from '@shared/theme/tokens'

import type { AgencyPublicProfileMiniSectionProps } from '../../types/agency-public-profile-editor'

const metrics = [
  { labelKey: 'properties', value: '128' },
  { labelKey: 'team', value: '18' },
  { labelKey: 'years', value: '14' },
  { labelKey: 'rating', value: '4.9' },
] as const

const team = ['Marina Costa', 'Juliana Mendes', 'Bianca Azevedo'] as const
const listings = ['Apartamento Jardins', 'Cobertura tríplex', 'Casa em condomínio'] as const

export function AgencyPublicProfileMiniSection({
  profileDraft,
  sectionKey,
}: AgencyPublicProfileMiniSectionProps) {
  const t = useTranslations('marketplace.agencyProfileEditor')

  if (sectionKey === 'brand') {
    return (
      <Box
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
            bgcolor: profileDraft.backgroundColor,
            backgroundImage: `linear-gradient(180deg, ${alpha.white[78]}, ${alpha.white[78]}), url("${profileDraft.bannerUrl}")`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            p: { xs: 1.4, md: 1.8 },
          }}
        >
          <Box
            sx={{
              minHeight: 132,
              border: '1px solid',
              borderColor: alpha.graphite[10],
              borderRadius: `${radius.sm}px`,
              backgroundImage: `url("${profileDraft.logoUrl}")`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
            }}
          />
        </Box>
        <Box sx={{ p: 1.6 }}>
          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
            {profileDraft.segments.split(',').map((segment) => (
              <Chip
                key={segment.trim()}
                label={segment.trim()}
                size="small"
                sx={{
                  borderRadius: `${radius.sm}px`,
                  bgcolor: alpha.graphite[6],
                  color: profileDraft.primaryColor,
                  fontWeight: 700,
                }}
              />
            ))}
          </Stack>
          <Typography sx={{ color: surface.darkText, fontSize: 22, fontWeight: 900 }}>
            {profileDraft.displayName}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>
            {profileDraft.legalCreci} / {profileDraft.headquarters}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 1 }}>
            {profileDraft.summary}
          </Typography>
        </Box>
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
        {metrics.map((metric) => (
          <Box
            key={metric.labelKey}
            sx={{
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              p: 1,
            }}
          >
            <Typography sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 800 }}>
              {t(`metrics.${metric.labelKey}`)}
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
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          gap: 0.8,
        }}
      >
        {team.map((name) => (
          <Stack
            key={name}
            direction="row"
            spacing={0.8}
            alignItems="center"
            sx={{
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              p: 1,
            }}
          >
            <Avatar alt={name} sx={{ width: 34, height: 34, bgcolor: profileDraft.primaryColor }}>
              {name.slice(0, 1)}
            </Avatar>
            <Typography noWrap sx={{ fontSize: 12, fontWeight: 900 }}>
              {name}
            </Typography>
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
        {listings.map((title) => (
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
                height: 74,
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
                R$ 1.420.000
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
      {[
        t('contactActions.call'),
        t('contactActions.email'),
        t('contactActions.openPublicLink'),
      ].map((action, index) => (
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
