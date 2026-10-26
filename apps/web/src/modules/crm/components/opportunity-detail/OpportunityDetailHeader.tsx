'use client'

import * as crmStyles from '../../styles/opportunity-detail-header.styles'

import { Breadcrumbs, Chip, Link, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { Link as LocalizedLink } from '@/i18n/navigation'
import type { OpportunityDetailHeaderProps } from '../../types/opportunity-detail'

export function OpportunityDetailHeader({ opportunity, stage }: OpportunityDetailHeaderProps) {
  const t = useTranslations('crm.opportunityDetail')
  const pipelineT = useTranslations('crm.pipeline')
  const stageLabel = pipelineT(`stages.${stage.labelKey}`)

  return (
    <>
      <Breadcrumbs aria-label={t('breadcrumbAriaLabel')} separator="›" sx={crmStyles.breadcrumbsSx}>
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
        sx={crmStyles.stackSx}
      >
        <Stack direction="row" alignItems="center" spacing={1.2} flexWrap="wrap" useFlexGap>
          <Typography component="h1" sx={crmStyles.typographySx}>
            {opportunity.leadName}
          </Typography>
          <Chip size="small" label={stageLabel} sx={crmStyles.getChipSx(stage)} />
        </Stack>
      </Stack>
    </>
  )
}
