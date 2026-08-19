'use client'

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
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

import type { BrokerCardProps } from '../types/broker'

export function BrokerCard(brokerCardProps: BrokerCardProps) {
  return (
    <Card
      component={Link}
      href={brokerCardProps.href}
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
      <CardContent sx={{ p: { xs: 2, md: 2.4 } }}>
        <Stack direction="row" spacing={1.6} alignItems="flex-start">
          <Avatar
            src={brokerCardProps.avatar}
            alt={brokerCardProps.name}
            sx={{ width: 58, height: 58, boxShadow: `0 0 0 3px ${alpha.magenta[8]}` }}
          />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={1}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ ...componentText.cardTitle, mb: 0.4 }}>
                  {brokerCardProps.name}
                </Typography>
                <Typography sx={{ color: 'text.secondary', ...componentText.cardBroker }}>
                  {brokerCardProps.creci}
                </Typography>
              </Box>
              <Stack direction="row" alignItems="center" spacing={0.35}>
                <StarRoundedIcon sx={{ color: 'primary.main', fontSize: iconSize.sm }} />
                <Typography sx={{ fontSize: 13, fontWeight: 900 }}>
                  {brokerCardProps.rating}
                </Typography>
              </Stack>
            </Stack>

            <Typography sx={{ color: 'text.secondary', ...componentText.cardMeta, mt: 1 }}>
              {brokerCardProps.region}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 1.8 }}>
          {brokerCardProps.specialties.map((specialty) => (
            <Chip
              key={specialty}
              label={specialty}
              size="small"
              sx={{
                height: 26,
                borderRadius: `${radius.sm}px`,
                bgcolor: alpha.magenta[6],
                color: 'primary.main',
                fontSize: 11,
                fontWeight: 800,
              }}
            />
          ))}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '2fr 0.85fr 0.85fr' },
            gap: 1,
            mt: 2,
          }}
        >
          {[
            { label: 'Região', value: brokerCardProps.region },
            { label: 'Imóveis', value: `${brokerCardProps.activeListings} ativos` },
            { label: 'Resposta', value: brokerCardProps.responseTime },
          ].map((item) => {
            const isRegion = item.value === brokerCardProps.region

            return (
              <Tooltip
                key={item.label}
                title={isRegion ? item.value : ''}
                placement="bottom-start"
                disableHoverListener={!isRegion}
              >
                <Box
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
                  <Typography sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 800 }}>
                    {item.label}
                  </Typography>
                  <Typography
                    noWrap={!isRegion}
                    sx={{
                      fontSize: 12,
                      fontWeight: 900,
                      lineHeight: 1.25,
                      mt: 0.25,
                      wordBreak: isRegion ? 'break-word' : undefined,
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              </Tooltip>
            )
          })}
        </Box>

        <Divider sx={{ my: 1.8 }} />

        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.35}>
          <Typography sx={{ color: 'primary.main', ...componentText.cardAction }}>
            Ver pagina publica
          </Typography>
          <ChevronRightIcon sx={{ color: 'primary.main', fontSize: iconSize.sm }} />
        </Stack>
      </CardContent>
    </Card>
  )
}
