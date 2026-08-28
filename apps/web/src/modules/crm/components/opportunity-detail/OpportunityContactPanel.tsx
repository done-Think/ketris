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
        <DetailItem label={t('fields.email')} value={opportunity.interessadoEmail} />
        <DetailItem
          label={t('fields.phone')}
          value={opportunity.interessadoTelefone ?? t('fields.notInformed')}
        />
        <DetailItem
          label={t('fields.proposedValue')}
          value={formatCurrency(opportunity.valorProposto)}
        />
        <DetailItem
          label={t('fields.contractTermLabel')}
          value={
            opportunity.prazoContratoMeses
              ? t('fields.months', { count: opportunity.prazoContratoMeses })
              : t('fields.notInformed')
          }
        />
        <DetailItem
          label={t('fields.intendedStart')}
          value={
            opportunity.inicioPretendido
              ? formatDate(opportunity.inicioPretendido)
              : t('fields.notInformed')
          }
        />
        <DetailItem
          label={t('fields.guarantee')}
          value={t(`guarantees.${opportunity.garantiaContratual}`)}
        />
      </Box>
      {(opportunity.condicoesEspeciais.length > 0 || opportunity.observacoes) && (
        <>
          <Divider sx={{ my: 2.2 }} />
          {opportunity.condicoesEspeciais.length > 0 && (
            <Box sx={{ mb: opportunity.observacoes ? 2 : 0 }}>
              <Typography sx={labelSx}>{t('fields.specialConditions')}</Typography>
              <Stack direction="row" gap={0.7} flexWrap="wrap" sx={{ mt: 0.8 }}>
                {opportunity.condicoesEspeciais.map((condition) => (
                  <Chip key={condition} label={condition} size="small" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}
          {opportunity.observacoes && (
            <DetailItem label={t('fields.notes')} value={opportunity.observacoes} />
          )}
        </>
      )}
    </Paper>
  )
}
