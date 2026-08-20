'use client'

import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import Link from 'next/link'

import {
  alpha,
  componentText,
  iconSize,
  motion,
  radius,
  shadows,
  surface,
} from '@shared/theme/tokens'

import type { AgencyCardProps } from '../types/agency'
import { AgencyBrandBanner } from './AgencyBrandBanner'

export function AgencyCard(agency: AgencyCardProps) {
  return (
    <Card
      component={Link}
      href={agency.href}
      sx={{
        border: '1px solid',
        borderColor: 'transparent',
        borderRadius: `${radius.sm}px`,
        color: 'inherit',
        boxShadow: shadows.propertyCard,
        overflow: 'hidden',
        textDecoration: 'none',
        transition: motion.transition.card,
        '&:hover': {
          borderColor: alpha.magenta[14],
          boxShadow: shadows.propertyCardHover,
          transform: 'translateY(-3px)',
        },
      }}
    >
      <Box sx={{ p: 1.3, pb: 0 }}>
        <AgencyBrandBanner agency={agency} size="compact" />
      </Box>

      <CardContent sx={{ p: { xs: 2, md: 2.2 } }}>
        <Typography sx={{ ...componentText.cardTitle, mb: 0.4 }}>{agency.name}</Typography>
        <Typography sx={{ color: 'text.secondary', ...componentText.cardBroker }}>
          {agency.legalCreci} / {agency.headquarters}
        </Typography>

        <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 1.6 }}>
          {agency.segments.slice(0, 3).map((segment) => (
            <Chip
              key={segment}
              label={segment}
              size="small"
              sx={{
                height: 26,
                borderRadius: `${radius.sm}px`,
                bgcolor: alpha.magenta[6],
                color: 'primary.main',
                fontSize: 11,
                fontWeight: 700,
              }}
            />
          ))}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 1,
            mt: 2,
          }}
        >
          {[
            { label: 'Imóveis', value: agency.activeListings, icon: ApartmentOutlinedIcon },
            { label: 'Equipe', value: agency.brokersCount, icon: GroupsOutlinedIcon },
            { label: 'Nota', value: agency.rating, icon: StarRoundedIcon },
          ].map(({ label, value, icon: Icon }) => (
            <Box
              key={label}
              sx={{
                minWidth: 0,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: `${radius.sm}px`,
                px: 1,
                py: 1,
                bgcolor: surface.app,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.45}>
                <Icon sx={{ color: 'text.secondary', fontSize: iconSize.xs }} />
                <Typography sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 700 }}>
                  {label}
                </Typography>
              </Stack>
              <Typography noWrap sx={{ fontSize: 12, fontWeight: 700, mt: 0.25 }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 1.8 }} />

        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.35}>
          <Typography sx={{ color: 'primary.main', ...componentText.cardAction }}>
            Ver página pública
          </Typography>
          <ChevronRightIcon sx={{ color: 'primary.main', fontSize: iconSize.sm }} />
        </Stack>
      </CardContent>
    </Card>
  )
}
