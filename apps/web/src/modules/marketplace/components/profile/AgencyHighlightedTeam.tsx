'use client'

import { Avatar, Box, Typography } from '@mui/material'

import { Link } from '@/i18n/navigation'
import { componentText, motion, radius, shadows, surface } from '@shared/theme/tokens'

import type { AgencyHighlightedTeamProps } from '../../types/agency-highlighted-team'
import { buildPublicProfileHref } from '../../utils/property-links'

export function AgencyHighlightedTeam({ brand, team }: AgencyHighlightedTeamProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${radius.sm}px`,
        bgcolor: surface.paper,
        p: { xs: 2, md: 2.4 },
        mb: 2.5,
      }}
    >
      <Typography variant="h5" sx={{ mb: 1.4 }}>
        Equipe em destaque
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          gap: 1.2,
        }}
      >
        {team.map((member) => (
          <Box
            key={member.usuarioId}
            component={Link}
            href={buildPublicProfileHref(`/brokers/${member.usuarioId}`, 'broker')}
            aria-label={`Ver perfil de ${member.name}`}
            sx={{
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: `${radius.sm}px`,
              bgcolor: brand.backgroundColor,
              color: 'inherit',
              display: 'flex',
              gap: 1.2,
              minHeight: 68,
              px: 1.2,
              py: 1,
              textDecoration: 'none',
              transition: motion.transition.card,
              '&:hover': {
                borderColor: brand.primaryColor,
                boxShadow: shadows.propertyCard,
              },
              '&:focus-visible': {
                outline: `2px solid ${brand.primaryColor}`,
                outlineOffset: 3,
              },
            }}
          >
            <Avatar
              src={member.avatarUrl ?? undefined}
              alt={member.name}
              sx={{ width: 42, height: 42, flexShrink: 0 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  color: brand.secondaryColor,
                  ...componentText.profileTeamName,
                }}
              >
                {member.name}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
