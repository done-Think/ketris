'use client'

import { Breadcrumbs, Chip, Link, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { Link as LocalizedLink } from '@/i18n/navigation'
import type { OpportunityDetailHeaderProps } from '../../types/opportunity-detail'
import { formatCurrency, formatMonthlyCurrency } from '../../utils/formatters'

export function OpportunityDetailHeader({
  opportunity,
  stage,
  property,
}: OpportunityDetailHeaderProps) {
  const t = useTranslations('crm.opportunityDetail')
  const pipelineT = useTranslations('crm.pipeline')
  const stageLabel = pipelineT(`stages.${stage.labelKey}`)

  return (
    <>
      <Breadcrumbs
        aria-label={t('breadcrumbAriaLabel')}
        separator="›"
        sx={{ mb: 1.2, '& .MuiBreadcrumbs-separator': { color: 'text.disabled' } }}
      >
        <Link component={LocalizedLink} href="/crm" underline="hover" color="text.secondary">
          {t('pipelineLink')}
        </Link>
        <Typography color="text.secondary">{stageLabel}</Typography>
        <Typography color="text.primary" fontWeight={700}>
          {opportunity.leadName}
        </Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        gap={1.5}
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.2} flexWrap="wrap" useFlexGap>
          <Typography component="h1" sx={{ fontSize: { xs: 27, md: 31 }, fontWeight: 800 }}>
            {opportunity.leadName}
          </Typography>
          <Chip
            size="small"
            label={stageLabel}
            sx={{ bgcolor: stage.softColor, color: stage.color, fontWeight: 800 }}
          />
        </Stack>
        <Typography sx={{ color: 'primary.main', fontSize: { xs: 24, md: 28 }, fontWeight: 900 }}>
          {property?.purpose === 'ALUGUEL'
            ? formatMonthlyCurrency(opportunity.proposedValue)
            : formatCurrency(opportunity.proposedValue)}
        </Typography>
      </Stack>
    </>
  )
}
