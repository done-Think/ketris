'use client'

import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import { Avatar, Box, Card, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'

import { brand, componentText, motion, radius, shadows } from '@shared/theme/tokens'

import { opportunityStageByStatus } from '../config/opportunity-stages'
import type { OpportunityCardProps } from '../types/opportunity-card'
import type { PublicPropertySummary } from '../types/property'
import {
  formatCurrency,
  formatMonthlyCurrency,
  formatRelativeDate,
  getInitials,
} from '../utils/formatters'

function getPropertyLocation(property?: PublicPropertySummary): string {
  if (!property) return 'Imóvel indisponível no catálogo'

  return [property.bairro, property.cidade].filter(Boolean).join(' - ') || property.tipo
}

export function OpportunityCard({
  opportunity,
  property,
  density = 'regular',
  presentation,
}: OpportunityCardProps) {
  const stage = opportunityStageByStatus[opportunity.status]
  const isCompact = density === 'compact'
  const indicatorColor = presentation?.indicatorColor ?? stage.color
  const indicatorLabel = presentation?.indicatorLabel ?? stage.label
  const propertyTitle = property?.titulo ?? `Imóvel ${opportunity.imovelId}`
  const value =
    property?.finalidade === 'ALUGUEL'
      ? formatMonthlyCurrency(opportunity.valorProposto)
      : formatCurrency(opportunity.valorProposto)

  return (
    <Card
      component={NextLink}
      href={`/crm/opportunities/${opportunity.id}`}
      aria-label={`Abrir oportunidade de ${opportunity.interessadoNome}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: isCompact ? 148 : 140,
        p: 2,
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
          fontSize: 14,
          fontWeight: 700,
          lineHeight: isCompact ? 1.3 : 1.4,
        }}
      >
        {opportunity.interessadoNome}
      </Typography>
      <Typography
        noWrap
        title={propertyTitle}
        sx={{
          mt: 0.25,
          color: 'text.secondary',
          fontSize: isCompact ? componentText.cardMeta.fontSize : 11.5,
          lineHeight: isCompact ? 1.35 : 1.45,
        }}
      >
        {propertyTitle}
      </Typography>
      <Typography
        noWrap
        title={getPropertyLocation(property)}
        sx={{
          display: isCompact ? 'none' : 'block',
          color: 'text.secondary',
          fontSize: 11,
          lineHeight: 1.4,
        }}
      >
        {getPropertyLocation(property)}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: isCompact ? 0.75 : 1,
          color: 'primary.main',
          fontSize: isCompact ? 16 : 14,
          fontWeight: isCompact ? 900 : 800,
          lineHeight: isCompact ? 1.35 : 1.4,
        }}
      >
        {value}
      </Typography>

      <Stack
        direction="row"
        alignItems="center"
        sx={{
          gap: isCompact ? 1 : 0.8,
          mt: 'auto',
          pt: isCompact ? 1 : 1.1,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Avatar
          aria-hidden="true"
          sx={{
            width: isCompact ? 28 : 24,
            height: isCompact ? 28 : 24,
            bgcolor: stage.softColor,
            color: stage.color,
            fontSize: isCompact ? 10 : 9,
            fontWeight: isCompact ? 700 : undefined,
          }}
        >
          {getInitials(opportunity.interessadoNome)}
        </Avatar>
        <Stack direction="row" alignItems="center" spacing={0.4} sx={{ minWidth: 0 }}>
          <AccessTimeRoundedIcon
            sx={{ display: isCompact ? 'none' : 'block', color: 'text.disabled', fontSize: 12 }}
          />
          <Typography
            noWrap
            sx={{
              px: isCompact ? 1 : 0,
              py: isCompact ? 0.375 : 0,
              borderRadius: isCompact ? `${radius.full}px` : 0,
              bgcolor: isCompact ? brand.neutral[50] : 'transparent',
              color: 'text.secondary',
              fontSize: isCompact ? componentText.cardMeta.fontSize : 10.5,
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
            width: 8,
            height: 8,
            ml: 'auto',
            borderRadius: `${radius.full}px`,
            bgcolor: indicatorColor,
          }}
        />
      </Stack>
    </Card>
  )
}
