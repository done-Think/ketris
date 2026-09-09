'use client'

import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import { Avatar, Box, Card, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { motion, radius, shadows } from '@shared/theme/tokens'

import { opportunityStageByStatus } from '../config/opportunity-stages'
import type { OpportunityCardProps } from '../types/opportunity-card'
import type { PublicPropertySummary } from '../types/property'
import {
  formatCurrency,
  formatMonthlyCurrency,
  formatRelativeDate,
  getInitials,
} from '../utils/formatters'

function getPropertyLocation(
  property: PublicPropertySummary | undefined,
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
  const t = useTranslations('crm.pipeline')
  const stage = opportunityStageByStatus[opportunity.status]
  const isCompact = density === 'compact'
  const indicatorColor = presentation?.indicatorColor ?? stage.color
  const indicatorLabel = presentation?.indicatorLabel ?? t(`stages.${stage.labelKey}`)
  const propertyTitle = property?.title ?? `Imóvel ${opportunity.propertyId}`
  const propertyLocation = getPropertyLocation(property, t('propertyUnavailable'))
  const value =
    property?.purpose === 'ALUGUEL'
      ? formatMonthlyCurrency(opportunity.proposedValue)
      : formatCurrency(opportunity.proposedValue)

  return (
    <Card
      component={Link}
      href={{ pathname: '/crm/opportunities/[id]', params: { id: opportunity.id } }}
      aria-label={t('openOpportunityAriaLabel', { name: opportunity.leadName })}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: isCompact ? 124 : undefined,
        minHeight: isCompact ? 124 : 140,
        p: isCompact ? 1.75 : 2,
        border: '1px solid',
        borderColor: isCompact ? 'transparent' : 'divider',
        borderRadius: isCompact ? `${radius.md}px` : 1.5,
        boxShadow: isCompact ? shadows.crmCardCompact : shadows.crmCard,
        color: 'text.primary',
        textDecoration: 'none',
        transition: motion.transition.card,
        '&:hover': {
          borderColor: indicatorColor,
          boxShadow: shadows.crmCardHover,
          transform: 'translateY(-1px)',
        },
        '&:focus-visible': {
          outline: `2px solid ${indicatorColor}`,
          outlineOffset: 2,
        },
      }}
    >
      <Typography
        noWrap
        sx={{
          fontSize: isCompact ? 12.5 : 14,
          fontWeight: 700,
          lineHeight: isCompact ? 1.3 : 1.4,
        }}
      >
        {opportunity.leadName}
      </Typography>
      <Typography
        noWrap
        title={propertyTitle}
        sx={{
          mt: 0.25,
          color: 'text.secondary',
          fontSize: isCompact ? 10.5 : 11.5,
          lineHeight: isCompact ? 1.35 : 1.45,
        }}
      >
        {propertyTitle}
      </Typography>
      <Typography
        noWrap
        title={propertyLocation}
        sx={{
          display: isCompact ? 'none' : 'block',
          color: 'text.secondary',
          fontSize: 11,
          lineHeight: 1.4,
        }}
      >
        {propertyLocation}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: isCompact ? 0.75 : 1,
          color: 'primary.main',
          fontSize: isCompact ? 13 : 14,
          fontWeight: 800,
          lineHeight: isCompact ? 1.35 : 1.4,
        }}
      >
        {value}
      </Typography>

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.8}
        sx={{
          mt: 'auto',
          pt: isCompact ? 0.75 : 1.1,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Avatar
          aria-hidden="true"
          sx={{
            width: isCompact ? 20 : 24,
            height: isCompact ? 20 : 24,
            bgcolor: stage.softColor,
            color: stage.color,
            fontSize: isCompact ? 8 : 9,
          }}
        >
          {getInitials(opportunity.leadName)}
        </Avatar>
        <Stack direction="row" alignItems="center" spacing={0.4} sx={{ minWidth: 0 }}>
          <AccessTimeRoundedIcon
            sx={{ display: isCompact ? 'none' : 'block', color: 'text.disabled', fontSize: 12 }}
          />
          <Typography
            noWrap
            sx={{
              px: isCompact ? 0.625 : 0,
              py: isCompact ? 0.25 : 0,
              borderRadius: isCompact ? '4px' : 0,
              bgcolor: isCompact ? 'grey.100' : 'transparent',
              color: 'text.secondary',
              fontSize: isCompact ? 10 : 10.5,
              lineHeight: isCompact ? 1.2 : 'normal',
            }}
          >
            {presentation?.relativeDateLabel ?? formatRelativeDate(opportunity.updatedAt)}
          </Typography>
        </Stack>
        <Box
          aria-label={indicatorLabel}
          title={indicatorLabel}
          sx={{
            width: isCompact ? 6 : 8,
            height: isCompact ? 6 : 8,
            ml: 'auto !important',
            borderRadius: `${radius.full}px`,
            bgcolor: indicatorColor,
          }}
        />
      </Stack>
    </Card>
  )
}
