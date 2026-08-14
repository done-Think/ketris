'use client'

import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import { Avatar, Box, Card, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'

import { opportunityStageByStatus } from '../config/opportunity-stages'
import type { Opportunity } from '../types/opportunity'
import type { PublicPropertySummary } from '../types/property'
import {
  formatCurrency,
  formatMonthlyCurrency,
  formatRelativeDate,
  getInitials,
} from '../utils/formatters'

type OpportunityCardProps = {
  opportunity: Opportunity
  property?: PublicPropertySummary
  density?: 'regular' | 'compact'
  presentation?: {
    indicatorColor?: string
    indicatorLabel?: string
    relativeDateLabel?: string
  }
}

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
      href={`/crm/oportunidades/${opportunity.id}`}
      aria-label={`Abrir oportunidade de ${opportunity.interessadoNome}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: isCompact ? 124 : undefined,
        minHeight: isCompact ? 124 : 140,
        p: isCompact ? 1.75 : 2,
        border: '1px solid',
        borderColor: isCompact ? 'transparent' : 'divider',
        borderRadius: isCompact ? '12px' : 1.5,
        boxShadow: isCompact ? '0 5px 16px rgba(33,38,49,0.06)' : '0 8px 24px rgba(33,38,49,0.06)',
        color: 'text.primary',
        textDecoration: 'none',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': {
          borderColor: indicatorColor,
          boxShadow: '0 14px 30px rgba(33,38,49,0.1)',
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
        {opportunity.interessadoNome}
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
          {getInitials(opportunity.interessadoNome)}
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
            borderRadius: '50%',
            bgcolor: indicatorColor,
          }}
        />
      </Stack>
    </Card>
  )
}
