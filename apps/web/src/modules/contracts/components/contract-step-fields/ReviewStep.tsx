import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius } from '@shared/theme/tokens'

import type {
  ContractReviewItemProps,
  ContractReviewPanelProps,
  ContractStepReviewProps,
} from '../../types/contract'
import { SectionTitle } from './shared'

export function ReviewItem({ label, value }: ContractReviewItemProps) {
  return (
    <Box>
      <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}>
        {value || '-'}
      </Typography>
    </Box>
  )
}

export function ReviewPanel({ title, items }: ContractReviewPanelProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: alpha.graphite[8],
        borderRadius: `${radius.sm}px`,
        p: { xs: 2, md: 2.4 },
      }}
    >
      <SectionTitle>{title}</SectionTitle>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 1.8,
        }}
      >
        {items.map((item) => (
          <ReviewItem key={`${title}-${item.label}`} {...item} />
        ))}
      </Box>
    </Box>
  )
}

export function ReviewStep({ values }: ContractStepReviewProps) {
  const t = useTranslations('contracts.wizard.review')
  const tConditions = useTranslations('contracts.wizard.conditions')
  const hasActiveGuarantor = values.hasGuarantor || values.guaranteeType === 'FIADOR'

  const partiesItems = [
    { label: t('labels.owner'), value: values.ownerName },
    { label: t('labels.ownerCpf'), value: values.ownerCpf },
    { label: t('labels.tenant'), value: values.tenantName },
    { label: t('labels.tenantCpf'), value: values.tenantCpf },
    ...(hasActiveGuarantor
      ? [
          { label: t('labels.guarantor'), value: values.guarantorName },
          { label: t('labels.guarantorCpf'), value: values.guarantorCpf },
        ]
      : []),
  ]

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
        gap: { xs: 2, md: 2.4 },
      }}
    >
      <ReviewPanel title={t('partiesTitle')} items={partiesItems} />
      <ReviewPanel
        title={t('conditionsTitle')}
        items={[
          {
            label: t('labels.contract'),
            value: tConditions(`contractTypeOptions.${values.contractType}`),
          },
          {
            label: t('labels.dueDay'),
            value: t('labels.dueDayValue', { day: values.dueDay }),
          },
          {
            label: t('labels.guarantee'),
            value: tConditions(`guaranteeTypeOptions.${values.guaranteeType}`),
          },
        ]}
      />
      <ReviewPanel
        title={t('termTitle')}
        items={[
          { label: t('labels.start'), value: values.startDate },
          { label: t('labels.end'), value: values.endDate },
          {
            label: t('labels.adjustment'),
            value: tConditions(`adjustmentIndexOptions.${values.adjustmentIndex}`),
          },
          { label: t('labels.notes'), value: values.notes },
        ]}
      />
    </Box>
  )
}
