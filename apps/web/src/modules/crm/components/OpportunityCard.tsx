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
}

function getPropertyLocation(property?: PublicPropertySummary): string {
  if (!property) return 'Imóvel indisponível no catálogo'

  return [property.bairro, property.cidade].filter(Boolean).join(' - ') || property.tipo
}

export function OpportunityCard({ opportunity, property }: OpportunityCardProps) {
  const stage = opportunityStageByStatus[opportunity.status]
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
        minHeight: 140,
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        boxShadow: '0 8px 24px rgba(33,38,49,0.06)',
        color: 'text.primary',
        textDecoration: 'none',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': {
          borderColor: stage.color,
          boxShadow: '0 14px 30px rgba(33,38,49,0.1)',
          transform: 'translateY(-1px)',
        },
        '&:focus-visible': {
          outline: `2px solid ${stage.color}`,
          outlineOffset: 2,
        },
      }}
    >
      <Typography noWrap sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>
        {opportunity.interessadoNome}
      </Typography>
      <Typography
        noWrap
        title={propertyTitle}
        sx={{ mt: 0.25, color: 'text.secondary', fontSize: 11.5, lineHeight: 1.45 }}
      >
        {propertyTitle}
      </Typography>
      <Typography
        noWrap
        title={getPropertyLocation(property)}
        sx={{ color: 'text.secondary', fontSize: 11, lineHeight: 1.4 }}
      >
        {getPropertyLocation(property)}
      </Typography>

      <Typography
        noWrap
        sx={{ mt: 1, color: 'primary.main', fontSize: 14, fontWeight: 800, lineHeight: 1.4 }}
      >
        {value}
      </Typography>

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.8}
        sx={{ mt: 'auto', pt: 1.1, borderTop: '1px solid', borderColor: 'divider' }}
      >
        <Avatar
          aria-hidden="true"
          sx={{ width: 24, height: 24, bgcolor: stage.softColor, color: stage.color, fontSize: 9 }}
        >
          {getInitials(opportunity.interessadoNome)}
        </Avatar>
        <Stack direction="row" alignItems="center" spacing={0.4} sx={{ minWidth: 0 }}>
          <AccessTimeRoundedIcon sx={{ color: 'text.disabled', fontSize: 12 }} />
          <Typography noWrap sx={{ color: 'text.secondary', fontSize: 10.5 }}>
            {formatRelativeDate(opportunity.updatedAt)}
          </Typography>
        </Stack>
        <Box
          aria-label={stage.label}
          title={stage.label}
          sx={{
            width: 8,
            height: 8,
            ml: 'auto !important',
            borderRadius: '50%',
            bgcolor: stage.color,
          }}
        />
      </Stack>
    </Card>
  )
}
