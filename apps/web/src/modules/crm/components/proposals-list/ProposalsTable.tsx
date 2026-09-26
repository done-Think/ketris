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
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '0.01em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          },
          '& .MuiTableBody-root .MuiTableCell-root': {
            px: 1.25,
            py: 0,
            color: brand.graphite[500],
            fontSize: 15.5,
            lineHeight: 1.3,
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
          <TableRow sx={{ height: 44, bgcolor: surface.app }}>
            {['Proposta', 'Lead', 'Imóvel', 'Valor', 'Status', 'Criada', 'Ações'].map((label) => (
              <TableCell key={label} scope="col" align={label === 'Ações' ? 'right' : 'left'}>
                {label.endsWith('es') ? (
                  <Box
                    component="span"
                    sx={{ display: 'inline-block', transform: 'translateX(-45px)' }}
                  >
                    {label}
                  </Box>
                ) : (
                  label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {proposals.map((proposal) => (
            <TableRow
              key={proposal.id}
              sx={{
                height: 58,
                bgcolor: surface.paper,
                transition: 'background-color 160ms ease',
                '&:hover': { bgcolor: alpha.graphite[6] },
              }}
            >
              <TableCell>
                <Typography noWrap sx={{ fontSize: 15.5, fontWeight: 800 }}>
                  {proposal.reference}
                </Typography>
              </TableCell>
              <TableCell>
                <Stack spacing={0.125} minWidth={0}>
                  <Typography noWrap sx={{ fontSize: 15.5, fontWeight: 600 }}>
                    {proposal.lead.name}
                  </Typography>
                  <Typography noWrap sx={{ color: 'text.disabled', fontSize: 14 }}>
                    {proposal.lead.email}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Stack spacing={0.125} minWidth={0}>
                  <Typography noWrap sx={{ fontSize: 15.5, fontWeight: 600 }}>
                    {proposal.property.title}
                  </Typography>
                  <Typography noWrap sx={{ color: 'text.disabled', fontSize: 14 }}>
                    {proposal.property.address}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography noWrap sx={{ fontSize: 15.5, fontWeight: 800 }}>
                  {proposal.valueLabel}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ transform: 'translateX(-10px)' }}>
                  <ProposalStatusChip status={proposal.status} />
                </Box>
              </TableCell>
              <TableCell>
                <Typography noWrap sx={{ color: 'text.secondary', fontSize: 15.5 }}>
                  {proposal.createdLabel}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Box sx={{ transform: 'translateX(-30px)' }}>
                  <ProposalActions
                    proposal={proposal}
                    onViewProposal={onViewProposal}
                    onOpenMoreOptions={onOpenMoreOptions}
                  />
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
