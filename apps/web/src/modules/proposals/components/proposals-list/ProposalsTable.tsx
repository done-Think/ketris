import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import { alpha, brand, surface } from '@shared/theme/tokens'

import type { ProposalsTableProps } from '../../types/proposal-management'
import { ProposalStatusChip } from '../ProposalStatusChip'
import { ProposalActions } from './ProposalActions'

const proposalTableColumnWidths = ['12%', '17%', '21%', '13%', '15%', '12%', '10%'] as const

export function ProposalsTable({
  proposals,
  onViewProposal,
  onOpenMoreOptions,
}: ProposalsTableProps) {
  return (
    <TableContainer sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
      <Table
        size="small"
        aria-label="Propostas do CRM"
        sx={{
          minWidth: 780,
          tableLayout: 'fixed',
          '& .MuiTableCell-root': { borderColor: 'divider' },
          '& .MuiTableHead-root .MuiTableCell-root': {
            px: 1.25,
            py: 0,
            color: brand.neutral[500],
            fontSize: 10.5,
            fontWeight: 800,
            lineHeight: 1.3,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          },
          '& .MuiTableBody-root .MuiTableCell-root': {
            px: 1.25,
            py: 0,
            color: brand.graphite[500],
            fontSize: 12.5,
            lineHeight: 1.35,
          },
          '& .MuiTableHead-root .MuiTableCell-root:last-of-type, & .MuiTableBody-root .MuiTableCell-root:last-of-type':
            {
              px: 0.75,
            },
        }}
      >
        <colgroup>
          {proposalTableColumnWidths.map((width, index) => (
            <Box component="col" key={`${width}-${index}`} sx={{ width }} />
          ))}
        </colgroup>
        <TableHead>
          <TableRow sx={{ height: 40, bgcolor: surface.app }}>
            {['Proposta', 'Lead', 'Imóvel', 'Valor', 'Status', 'Criada', 'Ações'].map((label) => (
              <TableCell key={label} scope="col" align={label === 'Ações' ? 'right' : 'left'}>
                {label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {proposals.map((proposal) => (
            <TableRow
              key={proposal.id}
              sx={{
                height: 55,
                bgcolor: surface.paper,
                transition: 'background-color 160ms ease',
                '&:hover': { bgcolor: alpha.graphite[6] },
              }}
            >
              <TableCell>
                <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 800 }}>
                  {proposal.reference}
                </Typography>
              </TableCell>
              <TableCell>
                <Stack spacing={0.125} minWidth={0}>
                  <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 600 }}>
                    {proposal.lead.name}
                  </Typography>
                  <Typography noWrap sx={{ color: 'text.disabled', fontSize: 10.5 }}>
                    {proposal.lead.email}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Stack spacing={0.125} minWidth={0}>
                  <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 600 }}>
                    {proposal.property.title}
                  </Typography>
                  <Typography noWrap sx={{ color: 'text.disabled', fontSize: 10.5 }}>
                    {proposal.property.address}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 800 }}>
                  {proposal.valueLabel}
                </Typography>
              </TableCell>
              <TableCell>
                <ProposalStatusChip status={proposal.status} />
              </TableCell>
              <TableCell>
                <Typography noWrap sx={{ color: 'text.secondary', fontSize: 12 }}>
                  {proposal.createdLabel}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <ProposalActions
                  proposal={proposal}
                  onViewProposal={onViewProposal}
                  onOpenMoreOptions={onOpenMoreOptions}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
