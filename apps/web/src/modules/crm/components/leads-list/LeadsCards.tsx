import { Box, Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../../styles/leads-cards.styles'

import type { LeadsCardsProps } from '../../types/lead'
import { LeadAvatar } from './LeadAvatar'
import { LeadStatusChip } from './LeadStatusChip'

export function LeadsCards({ leads, onContactLead }: LeadsCardsProps) {
  const t = useTranslations('crm.leads')

  return (
    <Stack aria-label={t('mobileListAriaLabel')} spacing={1.2} sx={crmStyles.stackSx}>
      {leads.map((lead) => (
        <Box key={lead.id} sx={crmStyles.boxSx}>
          <Stack spacing={1.4}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.2}>
              <Stack direction="row" alignItems="center" spacing={1.1} sx={crmStyles.stackSx2}>
                <LeadAvatar lead={lead} />
                <Box sx={crmStyles.stackSx2}>
                  <Typography noWrap sx={crmStyles.typographySx}>
                    {lead.name}
                  </Typography>
                  <Typography noWrap sx={crmStyles.typographySx2}>
                    {lead.source}
                  </Typography>
                </Box>
              </Stack>
              <LeadStatusChip stage={lead.stage} />
            </Stack>

            <Box>
              <Typography sx={crmStyles.typographySx3}>{t('tableColumns.interest')}</Typography>
              <Typography sx={crmStyles.typographySx4}>{lead.interest}</Typography>
            </Box>

            <Stack direction="row" justifyContent="space-between" spacing={1.2}>
              <Box>
                <Typography sx={crmStyles.typographySx3}>{t('tableColumns.budget')}</Typography>
                <Typography sx={crmStyles.typographySx}>{lead.budget}</Typography>
              </Box>
              <Box sx={crmStyles.boxSx2}>
                <Typography sx={crmStyles.typographySx3}>
                  {t('tableColumns.lastContact')}
                </Typography>
                <Typography sx={crmStyles.typographySx4}>{lead.lastContact}</Typography>
              </Box>
            </Stack>

            <Button
              type="button"
              variant="outlined"
              fullWidth
              disabled={!onContactLead}
              onClick={() => onContactLead?.(lead)}
              sx={crmStyles.buttonSx}
            >
              {t('contactAction')}
            </Button>
          </Stack>
        </Box>
      ))}
    </Stack>
  )
}
