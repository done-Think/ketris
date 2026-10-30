import { formatCurrency } from '@shared/lib/utils/format'
import { parseContractFormDate } from '../../utils/contract-date'
import { formatContractOption } from '../../utils/contract-option-message'
import { styles } from '../../styles/review-step.styles'
import { Box, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'
import { createContractDefaultValues } from '../../schemas/create-contract-schema'
import type {
  ContractReviewItemProps,
  ContractReviewPanelProps,
  ContractStepReviewProps,
} from '../../types/contract'
import { SectionTitle } from './shared'

export function ReviewItem({ label, value }: ContractReviewItemProps) {
  return (
    <Box>
      <Typography sx={styles.typography}>{label}</Typography>
      <Typography sx={styles.typography2}>{value || '-'}</Typography>
    </Box>
  )
}

export function ReviewPanel({ title, items }: ContractReviewPanelProps) {
  return (
    <Box sx={styles.box}>
      <SectionTitle>{title}</SectionTitle>
      <Box sx={styles.box2}>
        {items.map((item) => (
          <ReviewItem key={`${title}-${item.label}`} {...item} />
        ))}
      </Box>
    </Box>
  )
}

export function ReviewStep({ control }: ContractStepReviewProps) {
  const values = { ...createContractDefaultValues, ...useWatch({ control }) }
  const t = useTranslations('contracts.wizard.review')
  const tConditions = useTranslations('contracts.wizard.conditions')
  const formatter = useFormatter()
  function dateLabel(value: string) {
    const date = parseContractFormDate(value)
    return date ? formatter.dateTime(date, { dateStyle: 'short', timeZone: 'UTC' }) : value
  }
  const hasActiveGuarantor = values.hasGuarantor || values.guaranteeType === 'GUARANTOR'

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
    <Box sx={styles.box3}>
      <ReviewPanel title={t('partiesTitle')} items={partiesItems} />
      <ReviewPanel
        title={t('conditionsTitle')}
        items={[
          {
            label: t('labels.amount'),
            value: formatCurrency(values.amount, formatter.number),
          },
          {
            label: t('labels.contract'),
            value: formatContractOption('contractTypeOptions', values.contractType, tConditions),
          },
          {
            label: t('labels.dueDay'),
            value: t('labels.dueDayValue', { day: values.dueDay }),
          },
          {
            label: t('labels.guarantee'),
            value: formatContractOption('guaranteeTypeOptions', values.guaranteeType, tConditions),
          },
        ]}
      />
      <ReviewPanel
        title={t('termTitle')}
        items={[
          { label: t('labels.start'), value: dateLabel(values.startDate) },
          { label: t('labels.end'), value: dateLabel(values.endDate) },
          {
            label: t('labels.adjustment'),
            value: formatContractOption(
              'adjustmentIndexOptions',
              values.adjustmentIndex,
              tConditions,
            ),
          },
          { label: t('labels.notes'), value: values.notes },
        ]}
      />
    </Box>
  )
}
