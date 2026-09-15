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
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
        gap: 1.5,
        mt: 2,
      }}
    >
      {cards.map(({ label, value, icon: Icon, color, backgroundColor }) => (
        <Paper
          key={label}
          variant="outlined"
          sx={{
            display: 'flex',
            minHeight: 80,
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5,
            borderColor: brand.neutral[100],
            borderRadius: `${radius.md}px`,
            bgcolor: surface.paper,
            boxShadow: 'none',
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              display: 'grid',
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
          <Stack spacing={0.125} minWidth={0}>
            <Typography sx={{ color: 'text.secondary', fontSize: 11.5, lineHeight: 1.35 }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{value}</Typography>
          </Stack>
        </Paper>
      ))}
    </Box>
  )
}
