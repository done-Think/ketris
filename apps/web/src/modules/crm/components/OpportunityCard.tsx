'use client'

import { useCrmFormatter } from '../hooks/use-crm-formatter'

import * as crmStyles from '../styles/opportunity-card.styles'

import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import { Avatar, Box, Card, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

import { opportunityStageByStatus } from '../config/opportunity-stages'
import type { OpportunityCardProps } from '../types/opportunity-card'
import type { CrmPropertySummary } from '../types/property'
import { getInitials } from '../utils/formatters'

function getPropertyLocation(
  property: CrmPropertySummary | undefined,
  unavailableLabel: string,
): string {
  if (!property) return unavailableLabel

  return [property.neighborhood, property.city].filter(Boolean).join(' - ') || property.propertyType
}

export function OpportunityCard({
  opportunity,
  property,
  density = 'regular',
  presentation,
}: OpportunityCardProps) {
  const format = useCrmFormatter()
  const t = useTranslations('crm.pipeline')
  const stage = opportunityStageByStatus[opportunity.status]
  const isCompact = density === 'compact'
  const indicatorColor = presentation?.indicatorColor ?? stage.color
  const indicatorLabel = presentation?.indicatorLabel ?? t(`stages.${stage.labelKey}`)
  const propertyTitle = property?.title ?? t('propertyReference', { id: opportunity.propertyId })
  const propertyLocation = getPropertyLocation(property, t('propertyUnavailable'))
  const value =
    property?.purpose === 'ALUGUEL'
      ? format.money(opportunity.proposedValue, true)
      : format.money(opportunity.proposedValue)

  return (
    <Card
      component={Link}
      href={{ pathname: '/crm/opportunities/[id]', params: { id: opportunity.id } }}
      aria-label={t('openOpportunityAriaLabel', { name: opportunity.leadName })}
      sx={crmStyles.getCardSx(isCompact, indicatorColor)}
    >
      <Typography noWrap sx={crmStyles.getTypographySx(isCompact)}>
        {opportunity.leadName}
      </Typography>
      <Typography noWrap title={propertyTitle} sx={crmStyles.getTypographySx2(isCompact)}>
        {propertyTitle}
      </Typography>
      <Typography noWrap title={propertyLocation} sx={crmStyles.getTypographySx3(isCompact)}>
        {propertyLocation}
      </Typography>

      <Typography noWrap sx={crmStyles.getTypographySx4(isCompact)}>
        {value}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={0.8} sx={crmStyles.getStackSx(isCompact)}>
        <Avatar aria-hidden="true" sx={crmStyles.getAvatarSx(isCompact, stage)}>
          {getInitials(opportunity.leadName)}
        </Avatar>
        <Stack direction="row" alignItems="center" spacing={0.4} sx={crmStyles.stackSx}>
          <AccessTimeRoundedIcon sx={crmStyles.getAccessTimeRoundedIconSx(isCompact)} />
          <Typography noWrap sx={crmStyles.getTypographySx5(isCompact)}>
            {presentation?.relativeDateLabel ?? format.relative(opportunity.updatedAt)}
          </Typography>
        </Stack>
        <Box
          aria-label={indicatorLabel}
          title={indicatorLabel}
          sx={crmStyles.getBoxSx(isCompact, indicatorColor)}
        />
      </Stack>
    </Card>
  )
}
