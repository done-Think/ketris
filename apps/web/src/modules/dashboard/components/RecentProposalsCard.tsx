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

import { alpha, brand, radius, supportColor } from '@shared/theme/tokens'

import { ownerRecentProposals } from '../fixtures/owner-dashboard-fixtures'
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
        sx={{ minWidth: 0, px: 0.7, color: brand.neutral[500], fontSize: 10.5 }}
      >
        Recusar
      </Button>
      <Button
        variant="contained"
        size="small"
        aria-label={`Aceitar proposta ${proposalId}`}
        sx={{
          minWidth: 60,
          minHeight: 28,
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
      sx={{ ...ownerDashboardPanelSx, height: '100%', p: { xs: 2, md: 2.75 } }}
    >
      <Typography id="recent-proposals-title" component="h2" sx={ownerDashboardSectionTitleSx}>
        Propostas Recentes
      </Typography>

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
        divider={<Box sx={{ borderTop: '1px solid', borderColor: brand.neutral[100] }} />}
        sx={{ display: { xs: 'flex', md: 'none' }, mt: 1.5 }}
      >
        {ownerRecentProposals.map((proposal) => (
          <Box key={proposal.id} sx={{ py: 1.75 }}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={1}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 700 }}>
                  {proposal.property}
                </Typography>
                <Typography sx={{ ...ownerDashboardMetaSx, mt: 0.25 }}>
                  {proposal.proponent} · {proposal.date}
                </Typography>
              </Box>
              <ProposalStatusChip status={proposal.status} />
            </Stack>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 1.25 }}
            >
              <Typography sx={{ color: brand.magenta[600], fontSize: 12, fontWeight: 700 }}>
                {proposal.value}
              </Typography>
              <ProposalActions proposalId={proposal.id} />
            </Stack>
          </Box>
        ))}
      </Stack>
    </Paper>
  )
}
