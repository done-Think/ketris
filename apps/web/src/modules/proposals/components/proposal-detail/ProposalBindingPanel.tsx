import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { Avatar, Box, IconButton, Paper, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'

import { brand, iconSize, radius, surface } from '@shared/theme/tokens'

import type {
  ProposalBindingPanelProps,
  ProposalManagementPerson,
} from '../../types/proposal-management'
import {
  proposalPanelHeaderSx,
  proposalPanelSx,
  proposalPanelTitleSx,
} from './proposal-detail.styles'
import { proposalBindingLabelSx } from './proposal-detail.styles'

function getInitials(person: ProposalManagementPerson): string {
  return person.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function ProposalBindingPanel({ lead, property, broker }: ProposalBindingPanelProps) {
  return (
    <Paper
      component="section"
      aria-labelledby="proposal-binding-title"
      elevation={0}
      sx={{ ...proposalPanelSx, minHeight: { sm: 292 }, p: { xs: 2, sm: 2.5 } }}
    >
      <Box sx={proposalPanelHeaderSx}>
        <Typography id="proposal-binding-title" component="h2" sx={proposalPanelTitleSx}>
          Vinculação
        </Typography>
      </Box>

      <Box sx={{ pt: 1.75, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography sx={proposalBindingLabelSx}>Lead interessado</Typography>
        <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.75 }}>
          <Avatar
            src={lead.avatarUrl}
            alt={lead.name}
            sx={{
              width: 36,
              height: 36,
              bgcolor: brand.magenta[50],
              color: brand.magenta[700],
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {getInitials(lead)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>
              {lead.name}
            </Typography>
            <Typography
              noWrap
              title={lead.email}
              sx={{ color: brand.neutral[500], fontSize: 10, lineHeight: 1.35 }}
            >
              {lead.email}
            </Typography>
          </Box>
          <IconButton
            component={NextLink}
            href="/crm/contacts"
            aria-label={`Abrir contato de ${lead.name}`}
            size="small"
            sx={{ width: 28, height: 28, color: brand.neutral[500] }}
          >
            <OpenInNewRoundedIcon sx={{ fontSize: iconSize.xs }} />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography sx={proposalBindingLabelSx}>Imóvel</Typography>
        <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.75 }}>
          {property.thumbnailUrl ? (
            <Box
              component="img"
              src={property.thumbnailUrl}
              alt=""
              aria-hidden="true"
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: `${radius.sm}px`,
                objectFit: 'cover',
              }}
            />
          ) : (
            <Box
              aria-hidden="true"
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.app,
                color: brand.neutral[400],
              }}
            >
              <HomeWorkOutlinedIcon sx={{ fontSize: iconSize.lg }} />
            </Box>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>
              {property.title}
            </Typography>
            <Typography
              noWrap
              title={property.address}
              sx={{ color: brand.neutral[500], fontSize: 10, lineHeight: 1.35 }}
            >
              {property.address}
            </Typography>
          </Box>
          <IconButton
            component={NextLink}
            href={`/dashboard/imoveis/${property.id}`}
            aria-label={`Abrir imóvel ${property.title}`}
            size="small"
            sx={{ width: 28, height: 28, color: brand.neutral[500] }}
          >
            <OpenInNewRoundedIcon sx={{ fontSize: iconSize.xs }} />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ pt: 1.5 }}>
        <Typography sx={proposalBindingLabelSx}>Corretor responsável</Typography>
        <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.75 }}>
          <Avatar
            src={broker.avatarUrl}
            alt={broker.name}
            sx={{
              width: 36,
              height: 36,
              bgcolor: brand.neutral[100],
              color: brand.graphite[500],
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {getInitials(broker)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>
              {broker.name}
            </Typography>
            <Typography
              noWrap
              title={broker.email}
              sx={{ color: brand.neutral[500], fontSize: 10, lineHeight: 1.35 }}
            >
              {broker.email}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
  )
}
