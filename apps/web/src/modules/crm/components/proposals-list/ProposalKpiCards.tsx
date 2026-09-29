import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import { Box, Paper, Stack, Typography } from '@mui/material'

import { brand, iconSize, radius, supportColor, surface } from '@shared/theme/tokens'

import type { ProposalKpiCardsProps } from '../../types/proposal-management'

export function ProposalKpiCards({ summary }: ProposalKpiCardsProps) {
  const cards = [
    {
      label: 'Em negociação',
      value: String(summary.negotiationCount),
      icon: AccessTimeRoundedIcon,
      color: brand.semantic.warning,
      backgroundColor: supportColor.warningSoft,
    },
    {
      label: 'Valor total aceitas',
      value: summary.acceptedTotalLabel,
      icon: AttachMoneyRoundedIcon,
      color: brand.semantic.success,
      backgroundColor: supportColor.successSoft,
    },
    {
      label: 'Taxa de conversão',
      value: summary.conversionRateLabel,
      icon: TrendingUpRoundedIcon,
      color: brand.magenta[500],
      backgroundColor: brand.magenta[50],
    },
  ]

  return (
    <Box
      aria-label="Indicadores de propostas"
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: { xs: 0.8, md: 1.5 },
        mt: 2,
      }}
    >
      {cards.map(({ label, value, icon: Icon, color, backgroundColor }) => (
        <Paper
          key={label}
          variant="outlined"
          sx={{
            display: 'flex',
            minWidth: 0,
            minHeight: { xs: 84, md: 88 },
            alignItems: { xs: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 0.7, md: 1.5 },
            overflow: 'hidden',
            px: { xs: 1.2, md: 2 },
            py: { xs: 1.2, md: 1.5 },
            borderColor: brand.neutral[100],
            borderRadius: `${radius.md}px`,
            bgcolor: surface.paper,
            boxShadow: 'none',
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              display: { xs: 'none', md: 'grid' },
              width: 40,
              height: 40,
              flexShrink: 0,
              placeItems: 'center',
              borderRadius: `${radius.full}px`,
              bgcolor: backgroundColor,
              color,
            }}
          >
            <Icon sx={{ fontSize: iconSize.xl }} />
          </Box>
          <Stack spacing={{ xs: 0.5, md: 0.125 }} sx={{ width: '100%', minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                color: 'text.secondary',
                width: '100%',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: { xs: 10, md: 15 },
                fontWeight: { xs: 900, md: 400 },
                lineHeight: { xs: 1.2, md: 1.35 },
                textTransform: { xs: 'uppercase', md: 'none' },
              }}
            >
              {label}
            </Typography>
            <Typography
              noWrap
              sx={{
                width: '100%',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: { xs: 20, md: 24 },
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Box>
  )
}
