import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { OpportunityContactPanelProps } from '../../types/opportunity-detail'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { DetailItem } from './DetailItem'
import { labelSx, panelSx } from './opportunity-detail.styles'

export function OpportunityContactPanel({ opportunity }: OpportunityContactPanelProps) {
  const t = useTranslations('crm.opportunityDetail')

  return (
    <Paper component="section" elevation={0} sx={{ ...panelSx, p: { xs: 2, md: 2.5 } }}>
      <Typography component="h2" sx={{ mb: 2.2, fontSize: 16, fontWeight: 800 }}>
        {t('contactInterestTitle')}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 2.2,
        }}
      >
        <DetailItem label={t('fields.email')} value={opportunity.leadEmail} />
        <DetailItem
          label={t('fields.phone')}
          value={opportunity.leadPhone ?? t('fields.notInformed')}
        />
        <DetailItem
          label={t('fields.proposedValue')}
          value={formatCurrency(opportunity.proposedValue)}
        />
        <DetailItem
          label={t('fields.contractTermLabel')}
          value={
            opportunity.contractTermMonths
              ? t('fields.months', { count: opportunity.contractTermMonths })
              : t('fields.notInformed')
          }
        />
        <DetailItem
          label={t('fields.intendedStart')}
          value={
            opportunity.desiredStartDate
              ? formatDate(opportunity.desiredStartDate)
              : t('fields.notInformed')
          }
        />
        <DetailItem
          label={t('fields.guarantee')}
          value={t(`guarantees.${opportunity.guaranteeType}`)}
        />
      </Box>
      {(opportunity.specialConditions.length > 0 || opportunity.notes) && (
        <>
          <Divider sx={{ my: 2.2 }} />
          {opportunity.specialConditions.length > 0 && (
            <Box sx={{ mb: opportunity.notes ? 2 : 0 }}>
              <Typography sx={labelSx}>{t('fields.specialConditions')}</Typography>
              <Stack direction="row" gap={0.7} flexWrap="wrap" sx={{ mt: 0.8 }}>
                {opportunity.specialConditions.map((condition) => (
                  <Chip key={condition} label={condition} size="small" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}
          {opportunity.notes && <DetailItem label={t('fields.notes')} value={opportunity.notes} />}
        </>
      )}
    </Paper>
  )
}
