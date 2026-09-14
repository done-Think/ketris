import { Avatar, Box, Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { LeadsListProps } from '../types/lead'
import { getLeadInitials } from '../utils/lead-dashboard'
import { LeadStatusChip } from './LeadStatusChip'

export function LeadsMobileList({ leads, onLeadContactSelect }: LeadsListProps) {
  const t = useTranslations('crm.leads')

  return (
    <Stack spacing={1.2} sx={{ display: { xs: 'flex', md: 'none' } }}>
      {leads.map((lead) => (
        <Box
          key={lead.id}
          sx={{
            bgcolor: surface.paper,
            border: '1px solid',
            borderColor: alpha.graphite[6],
            borderRadius: `${radius.sm}px`,
            boxShadow: shadows.crmCard,
            p: 1.6,
          }}
        >
          <Stack spacing={1.4}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.2}>
              <Stack direction="row" alignItems="center" spacing={1.1} sx={{ minWidth: 0 }}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: alpha.magenta[10],
                    color: brand.magenta[700],
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  {getLeadInitials(lead.name)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}
                  >
                    {lead.name}
                  </Typography>
                  <Typography
                    noWrap
                    sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}
                  >
                    {lead.source}
                  </Typography>
                </Box>
              </Stack>
              <LeadStatusChip stage={lead.stage} />
            </Stack>

            <Box>
              <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
                {t('tableColumns.interest')}
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 800 }}>
                {lead.interest}
              </Typography>
            </Box>

            <Stack direction="row" justifyContent="space-between" spacing={1.2}>
              <Box>
                <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
                  {t('tableColumns.budget')}
                </Typography>
                <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}>
                  {lead.budget}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
                  {t('tableColumns.lastContact')}
                </Typography>
                <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 800 }}>
                  {lead.lastContact}
                </Typography>
              </Box>
            </Stack>

            <Button
              type="button"
              variant="outlined"
              fullWidth
              onClick={() => onLeadContactSelect(lead)}
              sx={{ borderRadius: `${radius.sm}px`, fontWeight: 900 }}
            >
              {t('contactAction')}
            </Button>
          </Stack>
        </Box>
      ))}
    </Stack>
  )
}
