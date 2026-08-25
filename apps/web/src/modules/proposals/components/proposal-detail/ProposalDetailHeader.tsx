import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Box, Button, Chip, Link, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'

import { brand, iconSize, radius, surface } from '@shared/theme/tokens'

import { proposalStatusPresentations } from '../../config/proposal-statuses'
import type { ProposalDetailHeaderProps } from '../../types/proposal-management'

export function ProposalDetailHeader({ detail, onEdit, onSendToOwner }: ProposalDetailHeaderProps) {
  const { proposal } = detail
  const status = proposalStatusPresentations[proposal.status]

  return (
    <Box component="header">
      <Link
        component={NextLink}
        href="/crm/proposals"
        underline="hover"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          color: brand.magenta[500],
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1.4,
        }}
      >
        <ArrowBackRoundedIcon sx={{ fontSize: iconSize.sm }} />
        Voltar para propostas
      </Link>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        gap={2}
        sx={{ mt: 1.25 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={{ xs: 0.75, sm: 1.25 }}
          useFlexGap
          flexWrap="wrap"
          sx={{ minWidth: 0 }}
        >
          <Typography
            component="h1"
            sx={{
              color: brand.graphite[500],
              fontSize: { xs: 22, sm: 26 },
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: '-0.015em',
            }}
          >
            Proposta — {proposal.property.title}
          </Typography>
          <Typography
            sx={{
              color: brand.neutral[500],
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {proposal.reference}
          </Typography>
          <Chip
            label={status.label}
            size="small"
            sx={{
              height: 22,
              borderRadius: `${radius.full}px`,
              bgcolor: status.backgroundColor,
              color: status.color,
              fontSize: 10,
              fontWeight: 700,
              '& .MuiChip-label': { px: 1.1 },
            }}
          />
        </Stack>

        <Stack direction="row" gap={1.25} sx={{ flexShrink: 0 }}>
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            onClick={() => onEdit?.(detail)}
            sx={{
              minWidth: 64,
              minHeight: { xs: 42, sm: 36 },
              px: 1.75,
              borderColor: brand.neutral[100],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              color: brand.graphite[500],
              fontSize: 12,
              fontWeight: 700,
              '&:hover': { borderColor: brand.neutral[200], bgcolor: surface.paper },
            }}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="contained"
            onClick={() => onSendToOwner?.(detail)}
            sx={{
              minHeight: { xs: 42, sm: 36 },
              px: { xs: 1.5, sm: 2 },
              borderRadius: `${radius.sm}px`,
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            Enviar ao proprietário
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
