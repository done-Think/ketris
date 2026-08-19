import { Breadcrumbs, Chip, Link, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'

import type { OpportunityDetailHeaderProps } from '../../types/opportunity-detail'
import { formatCurrency, formatMonthlyCurrency } from '../../utils/formatters'

export function OpportunityDetailHeader({
  opportunity,
  stage,
  property,
}: OpportunityDetailHeaderProps) {
  return (
    <>
      <Breadcrumbs
        aria-label="Navegação estrutural"
        separator="›"
        sx={{ mb: 1.2, '& .MuiBreadcrumbs-separator': { color: 'text.disabled' } }}
      >
        <Link component={NextLink} href="/crm" underline="hover" color="text.secondary">
          Pipeline
        </Link>
        <Typography color="text.secondary">{stage.label}</Typography>
        <Typography color="text.primary" fontWeight={700}>
          {opportunity.interessadoNome}
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
            {opportunity.interessadoNome}
          </Typography>
          <Chip
            size="small"
            label={stage.label}
            sx={{ bgcolor: stage.softColor, color: stage.color, fontWeight: 800 }}
          />
        </Stack>
        <Typography sx={{ color: 'primary.main', fontSize: { xs: 24, md: 28 }, fontWeight: 900 }}>
          {property?.finalidade === 'ALUGUEL'
            ? formatMonthlyCurrency(opportunity.valorProposto)
            : formatCurrency(opportunity.valorProposto)}
        </Typography>
      </Stack>
    </>
  )
}
