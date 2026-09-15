import { Box, Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { LeadsCardsProps } from '../../types/lead'
import { LeadAvatar } from './LeadAvatar'
import { LeadStatusChip } from './LeadStatusChip'

export function LeadsCards({ leads, onContactLead }: LeadsCardsProps) {
  const t = useTranslations('crm.leads')

  return (
    <Stack
      aria-label={t('mobileListAriaLabel')}
      spacing={1.2}
      sx={{ display: { xs: 'flex', md: 'none' }, p: 1.6 }}
    >
      {leads.map((lead) => (
        <Box
          key={lead.id}
          sx={{
            bgcolor: surface.paper,
            border: '1px solid',
            borderColor: brand.neutral[100],
            borderRadius: `${radius.sm}px`,
            boxShadow: shadows.crmCard,
            p: 1.6,
          }}
        >
          <Stack spacing={1.4}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.2}>
              <Stack direction="row" alignItems="center" spacing={1.1} sx={{ minWidth: 0 }}>
                <LeadAvatar lead={lead} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 800 }}>
                    {lead.name}
                  </Typography>
                  <Typography noWrap sx={{ color: 'text.secondary', fontSize: 11.5 }}>
                    {lead.source}
                  </Typography>
                </Box>
              </Stack>
              <LeadStatusChip stage={lead.stage} />
            </Stack>

            <Box>
              <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 700 }}>
                {t('tableColumns.interest')}
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{lead.interest}</Typography>
            </Box>

            <Stack direction="row" justifyContent="space-between" spacing={1.2}>
              <Box>
                <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 700 }}>
                  {t('tableColumns.budget')}
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{lead.budget}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 700 }}>
                  {t('tableColumns.lastContact')}
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{lead.lastContact}</Typography>
              </Box>
            </Stack>

            <Button
              type="button"
              variant="outlined"
              fullWidth
              disabled={!onContactLead}
              onClick={() => onContactLead?.(lead)}
              sx={{ borderRadius: `${radius.sm}px`, fontWeight: 800 }}
            >
              {t('contactAction')}
            </Button>
          </Stack>
        </Box>
      ))}
    </Stack>
  )
}
