import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
import { crmGuaranteeKey, crmStatusKey } from '@server/crm/constants/translation-keys'
import { useTranslations } from 'next-intl'
import { useCrmFormatter } from '../../hooks/use-crm-formatter'
import * as crmStyles from '../../styles/opportunity-contact-panel.styles'

import type { OpportunityContactPanelProps } from '../../types/opportunity-detail'
import { DetailItem } from './DetailItem'

export function OpportunityContactPanel({ opportunity }: OpportunityContactPanelProps) {
  const format = useCrmFormatter()
  const t = useTranslations('crm.opportunityDetail')

  return (
    <Paper component="section" elevation={0} sx={crmStyles.paperSx}>
      <Typography component="h2" sx={crmStyles.typographySx}>
        {t('contactInterestTitle')}
      </Typography>

      <Box>
        <Typography component="h3" sx={crmStyles.sectionTitleSx}>
          {t('leadSectionTitle')}
        </Typography>
        <Box sx={crmStyles.detailGridSx}>
          <DetailItem label={t('fields.name')} value={opportunity.leadName} />
          <DetailItem label={t('fields.email')} value={opportunity.leadEmail} />
          <DetailItem
            label={t('fields.phone')}
            value={opportunity.leadPhone ?? t('fields.notInformed')}
          />
          <DetailItem
            label={t('fields.currentStatus')}
            value={t(`statuses.${crmStatusKey(opportunity.status)}`)}
          />
          <DetailItem
            label={t('fields.linkedContact')}
            value={opportunity.contactId ? t('fields.linked') : t('fields.notLinked')}
          />
          <DetailItem label={t('fields.createdAt')} value={format.date(opportunity.createdAt)} />
          <DetailItem
            label={t('fields.archiveStatus')}
            value={opportunity.archivedAt ? t('fields.archived') : t('fields.active')}
          />
        </Box>
      </Box>

      <Divider sx={crmStyles.dividerSx} />

      <Box>
        <Typography component="h3" sx={crmStyles.sectionTitleSx}>
          {t('proposalSectionTitle')}
        </Typography>
        <Box sx={crmStyles.detailGridSx}>
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
                ? format.date(opportunity.desiredStartDate)
                : t('fields.notInformed')
            }
          />
          <DetailItem
            label={t('fields.guarantee')}
            value={t(`guarantees.${crmGuaranteeKey(opportunity.guaranteeType)}`)}
          />
          <DetailItem label={t('fields.updatedAt')} value={format.date(opportunity.updatedAt)} />
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
          <Divider sx={crmStyles.dividerSx} />
          <Box>
            <Typography component="h3" sx={crmStyles.sectionTitleSx}>
              {t('conditionsSectionTitle')}
            </Typography>
            {opportunity.specialConditions.length > 0 && (
              <Box sx={crmStyles.getBoxSx(opportunity)}>
                <Typography sx={crmStyles.typographySx2}>
                  {t('fields.specialConditions')}
                </Typography>
                <Stack
                  direction="row"
                  justifyContent="center"
                  gap={0.7}
                  flexWrap="wrap"
                  sx={crmStyles.stackSx}
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
