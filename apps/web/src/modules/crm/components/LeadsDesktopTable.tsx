import { Avatar, Box, Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, motion, radius, shadows, surface } from '@shared/theme/tokens'

import { leadTableColumnKeys } from '../config/lead-dashboard-ui'
import type { LeadsListProps } from '../types/lead'
import { getLeadInitials } from '../utils/lead-dashboard'
import { LeadStatusChip } from './LeadStatusChip'

export function LeadsDesktopTable({ leads, onLeadContactSelect, totalCount }: LeadsListProps) {
  const t = useTranslations('crm.leads')

  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'block' },
        bgcolor: surface.paper,
        border: '1px solid',
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.crmDetailPanel,
        overflowX: 'auto',
      }}
    >
      <Box sx={{ minWidth: 840 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1.55fr 1.55fr 0.85fr 0.95fr 0.9fr 1fr 0.8fr',
            columnGap: 1.8,
            px: 2.4,
            py: 1.8,
          }}
        >
          {leadTableColumnKeys.map((columnKey) => (
            <Typography
              key={columnKey}
              sx={{
                color: brand.neutral[500],
                fontSize: 11,
                fontWeight: 900,
                textTransform: 'uppercase',
              }}
            >
              {t(`tableColumns.${columnKey}`)}
            </Typography>
          ))}
        </Box>

        {leads.map((lead) => (
          <Box
            key={lead.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: '1.55fr 1.55fr 0.85fr 0.95fr 0.9fr 1fr 0.8fr',
              columnGap: 1.8,
              alignItems: 'center',
              minHeight: 64,
              px: 2.4,
              borderTop: '1px solid',
              borderColor: alpha.graphite[6],
              transition: motion.transition.interactive,
              '&:hover': { bgcolor: brand.neutral[50] },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0 }}>
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: alpha.magenta[10],
                  color: brand.magenta[700],
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                {getLeadInitials(lead.name)}
              </Avatar>
              <Typography noWrap sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 900 }}>
                {lead.name}
              </Typography>
            </Stack>
            <Typography noWrap sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
              {lead.interest}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 900 }}>
              {lead.budget}
            </Typography>
            <LeadStatusChip stage={lead.stage} />
            <Typography noWrap sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
              {lead.source}
            </Typography>
            <Typography noWrap sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
              {lead.lastContact}
            </Typography>
            <Button
              type="button"
              size="small"
              onClick={() => onLeadContactSelect(lead)}
              sx={{
                justifySelf: 'start',
                minWidth: 0,
                px: 0.6,
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              {t('contactAction')}
            </Button>
          </Box>
        ))}
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ borderTop: '1px solid', borderColor: alpha.graphite[6], px: 2.4, py: 1.6 }}
      >
        <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
          {t('resultsCount', { count: leads.length, total: totalCount ?? leads.length })}
        </Typography>
        <Stack direction="row" spacing={0.6}>
          {[1, 2, 3].map((page) => (
            <Button
              key={page}
              variant={page === 1 ? 'contained' : 'outlined'}
              sx={{ minWidth: 30, width: 30, height: 30, borderRadius: `${radius.sm}px`, p: 0 }}
            >
              {page}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}
