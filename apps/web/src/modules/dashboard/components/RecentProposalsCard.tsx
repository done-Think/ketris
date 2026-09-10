import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import { alpha, brand, radius, supportColor, surface, shadows } from '@shared/theme/tokens'

import { ownerRecentProposals, ownerDashboardMetrics } from '../fixtures/owner-dashboard-fixtures'
import type { OwnerProposalStatus } from '../types/owner-dashboard'
import {
  ownerDashboardMetaSx,
  ownerDashboardPanelSx,
  ownerDashboardSectionTitleSx,
} from './owner-dashboard.styles'

const proposalStatusStyles: Record<
  OwnerProposalStatus,
  { label: string; color: string; bgcolor: string }
> = {
  new: {
    label: 'Nova',
    color: brand.magenta[700],
    bgcolor: alpha.magenta[10],
  },
  accepted: {
    label: 'Aceita',
    color: brand.semantic.success,
    bgcolor: supportColor.successSoft,
  },
}

function ProposalStatusChip({ status }: { status: OwnerProposalStatus }) {
  const presentation = proposalStatusStyles[status]

  return (
    <Chip
      label={presentation.label}
      size="small"
      sx={{
        height: 22,
        bgcolor: presentation.bgcolor,
        borderRadius: `${radius.full}px`,
        color: presentation.color,
        fontSize: 10.5,
        fontWeight: 700,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  )
}

function ProposalActions({ proposalId }: { proposalId: string }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5}>
      <Button
        size="small"
        aria-label={`Recusar proposta ${proposalId}`}
        sx={{
          minWidth: { xs: 44, md: 0 },
          minHeight: { xs: 44, md: 28 },
          px: 0.7,
          color: brand.neutral[500],
          fontSize: { xs: 11, md: 10.5 },
        }}
      >
        Recusar
      </Button>
      <Button
        variant="contained"
        size="small"
        aria-label={`Aceitar proposta ${proposalId}`}
        sx={{
          minWidth: 60,
          minHeight: { xs: 44, md: 28 },
          borderRadius: `${radius.sm}px`,
          px: 1.1,
          fontSize: 10.5,
        }}
      >
        Aceitar
      </Button>
    </Stack>
  )
}

export function RecentProposalsCard() {
  return (
    <Paper
      component="section"
      aria-labelledby="recent-proposals-title"
      elevation={0}
      sx={{
        ...ownerDashboardPanelSx,
        height: '100%',
        p: { xs: 0, md: 2.75 },
        bgcolor: { xs: 'transparent', md: surface.paper },
        border: { xs: 0, md: ownerDashboardPanelSx.border },
        boxShadow: { xs: 'none', md: ownerDashboardPanelSx.boxShadow },
      }}
    >
      <Typography
        id="recent-proposals-title"
        component="h2"
        sx={{ ...ownerDashboardSectionTitleSx, display: { xs: 'none', md: 'block' } }}
      >
        Propostas Recentes
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ display: { xs: 'flex', md: 'none' } }}
      >
        <Typography
          component="h2"
          sx={{ fontSize: 11, fontWeight: 700, color: brand.neutral[600] }}
        >
          PROPOSTAS RECEBIDAS
        </Typography>
        <Chip
          label={ownerDashboardMetrics.find((metric) => metric.id === 'pending-proposals')?.value}
          sx={{
            height: 18,
            bgcolor: 'primary.main',
            color: surface.lightText,
            fontSize: 10,
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      </Stack>

      <TableContainer sx={{ display: { xs: 'none', md: 'block' }, mt: 1.5, overflow: 'visible' }}>
        <Table
          size="small"
          aria-label="Propostas recentes do proprietário"
          sx={{ tableLayout: 'fixed' }}
        >
          <TableHead>
            <TableRow>
              {[
                { label: 'Imóvel', width: '25%' },
                { label: 'Proponente', width: '18%' },
                { label: 'Valor prop.', width: '18%' },
                { label: 'Data', width: '10%' },
                { label: 'Status', width: '11%' },
                { label: 'Ações', width: '18%' },
              ].map((heading) => (
                <TableCell
                  key={heading.label}
                  align={heading.label === 'Ações' ? 'right' : 'left'}
                  sx={{
                    width: heading.width,
                    borderColor: brand.neutral[100],
                    color: brand.neutral[600],
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.025em',
                    px: 0,
                    py: 1.55,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {heading.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {ownerRecentProposals.map((proposal) => (
              <TableRow key={proposal.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                <TableCell sx={{ borderColor: brand.neutral[100], px: 0, py: 1.8 }}>
                  <Typography
                    noWrap
                    sx={{ color: brand.graphite[500], fontSize: 12, fontWeight: 700 }}
                  >
                    {proposal.property}
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderColor: brand.neutral[100], px: 0, py: 1.8 }}>
                  <Typography noWrap sx={{ color: brand.neutral[600], fontSize: 11.5 }}>
                    {proposal.proponent}
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderColor: brand.neutral[100], px: 0, py: 1.8 }}>
                  <Typography
                    noWrap
                    sx={{ color: brand.magenta[600], fontSize: 11.5, fontWeight: 700 }}
                  >
                    {proposal.value}
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderColor: brand.neutral[100], px: 0, py: 1.8 }}>
                  <Typography noWrap sx={{ color: brand.neutral[400], fontSize: 10.5 }}>
                    {proposal.date}
                  </Typography>
                </TableCell>
                <TableCell sx={{ borderColor: brand.neutral[100], px: 0, py: 1.8 }}>
                  <ProposalStatusChip status={proposal.status} />
                </TableCell>
                <TableCell align="right" sx={{ borderColor: brand.neutral[100], px: 0, py: 1.25 }}>
                  <ProposalActions proposalId={proposal.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack
        aria-label="Lista móvel de propostas recentes"
        spacing={1.5}
        sx={{ display: { xs: 'flex', md: 'none' }, mt: 1.5 }}
      >
        {ownerRecentProposals
          .filter((proposal) => proposal.mobileVisible !== false)
          .map((proposal) => (
            <Box
              key={proposal.id}
              sx={{
                p: 1.5,
                bgcolor: surface.paper,
                borderRadius: `${radius.md}px`,
                boxShadow: shadows.crmCardCompact,
              }}
            >
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                spacing={1}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 700 }}>
                    {proposal.mobileProperty || proposal.property}
                  </Typography>
                  <Typography sx={{ ...ownerDashboardMetaSx, mt: 0.25 }}>
                    {proposal.proponent}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    alignSelf: 'flex-end',
                    whiteSpace: 'nowrap',
                    color: 'primary.main',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {proposal.value}
                </Typography>
              </Stack>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mt: 0.5 }}
              >
                <Typography sx={{ color: brand.neutral[400], fontSize: 10 }}>
                  {proposal.mobileDate || proposal.date}
                </Typography>
                <ProposalActions proposalId={proposal.id} />
              </Stack>
            </Box>
          ))}
      </Stack>
    </Paper>
  )
}
