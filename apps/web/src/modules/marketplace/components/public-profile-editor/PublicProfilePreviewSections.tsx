'use client'

import { Avatar, Box, Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { alpha, componentText, radius, surface } from '@shared/theme/tokens'
import type { LocalizedHref } from '@shared/types/localized-href'

import type { PublicProfileMiniSectionProps } from '../../types/public-profile-editor'

const previewMetrics = [
  { labelKey: 'rating', value: '4.9' },
  { labelKey: 'responseTime', value: '15 min' },
  { labelKey: 'properties', value: '42' },
  { labelKey: 'closed', value: '128' },
] as const

const previewListings = ['Apartamento Jardins', 'Garden Remodelado', 'Cobertura Duplex'] as const

function getProfileUrlHref(profileUrl: string): LocalizedHref {
  const id = profileUrl.split('?')[0].split('/').filter(Boolean).at(-1)

  if (id && profileUrl.startsWith('/brokers/')) {
    return {
      pathname: '/brokers/[id]',
      params: { id },
    }
  }

  if (id && profileUrl.startsWith('/agencies/')) {
    return {
      pathname: '/agencies/[id]',
      params: { id },
    }
  }

  return profileUrl as LocalizedHref
}

export function PublicProfileMiniSection({
  profileDraft,
  sectionKey,
}: PublicProfileMiniSectionProps) {
  const t = useTranslations('marketplace.profileEditor')
  const metricsT = useTranslations('marketplace.publicProfile.metrics')

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
            minHeight: { xs: 168, md: 190 },
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
              fontSize: { xs: 20, md: 26 },
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
              width: 62,
              height: 62,
              boxShadow: `0 0 0 4px ${profileDraft.primaryColor}`,
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: surface.darkText, fontSize: 22, fontWeight: 900 }}>
              {profileDraft.displayName}
            </Typography>
            <Typography sx={{ color: 'text.secondary', ...componentText.cardMeta }}>
              {t('configurableProfile')}
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
              {metricsT(metric.labelKey)}
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
            {t('emptyMembers')}
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
        {profileDraft.teamMembers.map((member) => {
          const content = (
            <>
              <Avatar src={member.avatarUrl} alt={member.name} sx={{ width: 34, height: 34 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 12, fontWeight: 900 }}>
                  {member.name || t('newMember')}
                </Typography>
                <Typography noWrap sx={{ color: 'text.secondary', fontSize: 10 }}>
                  {member.role || t('fields.role')}
                </Typography>
              </Box>
            </>
          )
          const sx = {
            alignItems: 'center',
            border: '1px solid',
            borderColor: alpha.graphite[8],
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            color: 'inherit',
            display: 'flex',
            gap: 0.8,
            p: 1,
            textDecoration: 'none',
          } as const

          if (member.profileUrl) {
            return (
              <Box
                key={`${member.profileUrl}-${member.name}`}
                component={Link}
                href={getProfileUrlHref(member.profileUrl)}
                sx={sx}
              >
                {content}
              </Box>
            )
          }

          return (
            <Box key={`${member.profileUrl}-${member.name}`} sx={sx}>
              {content}
            </Box>
          )
        })}
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
