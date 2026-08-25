import {
  Box,
  Chip,
  Link as MuiLink,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import { brand, supportColor } from '@shared/theme/tokens'

import type {
  DashboardRecentLeadStatus,
  DashboardStatusStyle,
  RecentLeadsTableProps,
} from '../types/dashboard-overview'
import { DashboardPanel } from './DashboardPanel'

const statusStyles: Record<DashboardRecentLeadStatus, DashboardStatusStyle> = {
  Novo: { bgcolor: brand.magenta[50], color: brand.magenta[600] },
  'Em Andamento': { bgcolor: supportColor.infoSoft, color: brand.semantic.info },
  Qualificado: { bgcolor: supportColor.warningSoft, color: brand.semantic.warning },
  Pendente: { bgcolor: brand.magenta[50], color: brand.magenta[600] },
}

export function RecentLeadsTable({ leads, onLeadSelect }: RecentLeadsTableProps) {
  return (
    <DashboardPanel>
      <Box sx={{ p: { xs: 2, md: 2.4 } }}>
        <Typography
          sx={{
            color: brand.neutral[500],
            fontSize: 11,
            fontWeight: 900,
            textTransform: 'uppercase',
          }}
        >
          Leads recentes
        </Typography>

        <TableContainer sx={{ mt: 1.4 }}>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                {['Nome', 'Interesse', 'Status', 'Origem', 'Ações'].map((heading) => (
                  <TableCell
                    key={heading}
                    sx={{
                      borderBottom: 'none',
                      color: brand.neutral[500],
                      fontSize: 10,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                    }}
                  >
                    {heading}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.name}>
                  <TableCell sx={{ borderBottom: 'none', py: 1.1 }}>
                    <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 900 }}>
                      {lead.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: 'none', py: 1.1 }}>
                    <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
                      {lead.interest}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: 'none', py: 1.1 }}>
                    <Chip
                      label={lead.status}
                      size="small"
                      sx={{
                        height: 22,
                        bgcolor: statusStyles[lead.status].bgcolor,
                        color: statusStyles[lead.status].color,
                        fontSize: 10,
                        fontWeight: 900,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: 'none', py: 1.1 }}>
                    <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
                      {lead.origin}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: 'none', py: 1.1 }}>
                    <Stack direction="row" spacing={1.5}>
                      <MuiLink
                        href={`tel:${lead.phone.replace(/\D/g, '')}`}
                        underline="none"
                        sx={{ color: brand.magenta[600], fontSize: 12, fontWeight: 900 }}
                      >
                        Ligar
                      </MuiLink>
                      <MuiLink
                        component="button"
                        underline="none"
                        onClick={() => onLeadSelect(lead)}
                        sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}
                      >
                        Detalhes
                      </MuiLink>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </DashboardPanel>
  )
}
