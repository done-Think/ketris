import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'

import type { OpportunityContactPanelProps } from '../../types/opportunity-detail'
import { formatDate } from '../../utils/formatters'
import { DetailItem } from './DetailItem'
import { labelSx, panelSx } from './opportunity-detail.styles'

const detailGridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
  columnGap: 1.4,
  rowGap: 1,
  '& > :nth-of-type(even)': {
    pl: { sm: 3.65, md: 4.45 },
  },
} as const

const sectionTitleSx = {
  mb: 0.45,
  color: 'text.secondary',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0,
  textAlign: 'center',
  textTransform: 'uppercase',
} as const

export function OpportunityContactPanel({ opportunity }: OpportunityContactPanelProps) {
  const locale = useLocale() as AppLocale
  const t = useTranslations('crm.opportunityDetail')

  return (
    <Paper
      component="section"
      elevation={0}
      sx={{
        ...panelSx,
        height: '100%',
        pl: { xs: 3.65, md: 4.45 },
        pr: { xs: 2.4, md: 3.2 },
        py: { xs: 2, md: 2.5 },
      }}
    >
      <Typography
        component="h2"
        sx={{ mb: 1.35, fontSize: 16, fontWeight: 800, textAlign: 'center' }}
      >
        {t('contactInterestTitle')}
      </Typography>

      <Box>
        <Typography component="h3" sx={sectionTitleSx}>
          {t('leadSectionTitle')}
        </Typography>
        <Box sx={detailGridSx}>
          <DetailItem label={t('fields.name')} value={opportunity.leadName} />
          <DetailItem label={t('fields.email')} value={opportunity.leadEmail} />
          <DetailItem
            label={t('fields.phone')}
            value={opportunity.leadPhone ?? t('fields.notInformed')}
          />
          <DetailItem
            label={t('fields.currentStatus')}
            value={t(`statuses.${opportunity.status}`)}
          />
          <DetailItem
            label={t('fields.linkedContact')}
            value={opportunity.contactId ? t('fields.linked') : t('fields.notLinked')}
          />
          <DetailItem
            label={t('fields.createdAt')}
            value={formatDate(opportunity.createdAt, locale)}
          />
          <DetailItem
            label={t('fields.archiveStatus')}
            value={opportunity.archivedAt ? t('fields.archived') : t('fields.active')}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 1.25 }} />

      <Box>
        <Typography component="h3" sx={sectionTitleSx}>
          {t('proposalSectionTitle')}
        </Typography>
        <Box sx={detailGridSx}>
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
                ? formatDate(opportunity.desiredStartDate, locale)
                : t('fields.notInformed')
            }
          />
          <DetailItem
            label={t('fields.guarantee')}
            value={t(`guarantees.${opportunity.guaranteeType}`)}
          />
          <DetailItem
            label={t('fields.updatedAt')}
            value={formatDate(opportunity.updatedAt, locale)}
          />
          <DetailItem label={t('fields.reference')} value={opportunity.id.slice(0, 8)} />
          <DetailItem
            label={t('fields.specialConditionsCount')}
            value={t('fields.conditionsCount', {
              count: opportunity.specialConditions.length,
            })}
          />
        </Box>
      </Box>

      {(opportunity.specialConditions.length > 0 || opportunity.notes) && (
        <>
          <Divider sx={{ my: 1.25 }} />
          <Box>
            <Typography component="h3" sx={sectionTitleSx}>
              {t('conditionsSectionTitle')}
            </Typography>
            {opportunity.specialConditions.length > 0 && (
              <Box sx={{ mb: opportunity.notes ? 2 : 0 }}>
                <Typography sx={{ ...labelSx, textAlign: 'center' }}>
                  {t('fields.specialConditions')}
                </Typography>
                <Stack
                  direction="row"
                  justifyContent="center"
                  gap={0.7}
                  flexWrap="wrap"
                  sx={{ mt: 0.8 }}
                >
                  {opportunity.specialConditions.map((condition) => (
                    <Chip key={condition} label={condition} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}
            {opportunity.notes && (
              <DetailItem label={t('fields.notes')} value={opportunity.notes} />
            )}
          </Box>
        </>
      )}
    </Paper>
  )
}
