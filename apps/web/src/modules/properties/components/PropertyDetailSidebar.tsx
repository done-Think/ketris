import { Avatar, Box, Chip, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { dashboardPropertyActivityToneStyles } from '../config/dashboard-property-ui'
import type { PropertyDetailSidebarProps } from '../types/dashboard-property'

export function PropertyDetailSidebar({ property }: PropertyDetailSidebarProps) {
  const t = useTranslations('properties.detail')

  return (
    <Stack sx={{ width: { xs: '100%', lg: 430 }, flexShrink: 0 }} spacing={2.8}>
      <Box
        sx={{
          bgcolor: surface.paper,
          border: '1px solid',
          borderColor: alpha.graphite[6],
          borderRadius: `${radius.md}px`,
          boxShadow: shadows.propertyCard,
          px: 2.8,
          py: 2.8,
        }}
      >
        <Typography sx={{ fontSize: 22, fontWeight: 900, mb: 2.4 }}>
          {t('participantsTitle')}
        </Typography>
        <Stack spacing={2}>
          {property.participants.map((participant) => (
            <Stack key={participant.name} direction="row" alignItems="center" spacing={1.5}>
              <Avatar
                src={participant.imageUrl}
                sx={{
                  width: 46,
                  height: 46,
                  bgcolor: brand.neutral[700],
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                {participant.initials}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 900 }}>{participant.name}</Typography>
                <Chip
                  label={participant.role}
                  size="small"
                  sx={{
                    height: 20,
                    borderRadius: `${radius.sm}px`,
                    bgcolor: alpha.graphite[6],
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                />
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box
        sx={{
          bgcolor: surface.paper,
          border: '1px solid',
          borderColor: alpha.graphite[6],
          borderRadius: `${radius.md}px`,
          boxShadow: shadows.propertyCard,
          px: 2.8,
          py: 2.8,
        }}
      >
        <Typography sx={{ fontSize: 22, fontWeight: 900, mb: 2.5 }}>
          {t('activityTitle')}
        </Typography>
        <Stack spacing={2.4}>
          {property.activityHistory.map((activity) => (
            <Stack key={`${activity.label}-${activity.date}`} direction="row" spacing={1.7}>
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: `${radius.full}px`,
                  bgcolor: dashboardPropertyActivityToneStyles[activity.tone],
                  mt: 0.8,
                  flexShrink: 0,
                }}
              />
              <Box>
                <Typography sx={{ fontSize: 15.5, fontWeight: 700 }}>{activity.label}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  {activity.date}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Stack>
  )
}
