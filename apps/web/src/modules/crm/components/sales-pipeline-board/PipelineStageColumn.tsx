import { Box, Skeleton, Stack, Typography } from '@mui/material'

import { brand, radius, surface } from '@shared/theme/tokens'

import type { PipelineStageColumnProps } from '../../types/sales-pipeline'
import { formatCurrency } from '../../utils/formatters'
import { OpportunityCard } from '../OpportunityCard'

const pipelineBodyFontFamily = 'var(--font-inter), system-ui, -apple-system, sans-serif'
const pipelineStageLabelSx = {
  fontFamily: pipelineBodyFontFamily,
  fontSize: 10.5,
  fontWeight: 700,
  lineHeight: '14px',
  letterSpacing: 0,
  fontSynthesis: 'none',
  textTransform: 'uppercase',
} as const

export function PipelineStageColumn({
  stage,
  opportunities,
  projectedTotals,
  isPipelineLoading,
  hasPipelineError,
  fixtureMode,
  propertiesById,
  presentationByOpportunityId,
}: PipelineStageColumnProps) {
  return (
    <Stack
      component="section"
      role="region"
      aria-labelledby={`sales-pipeline-stage-${stage.id}`}
      sx={{
        minWidth: 0,
        minHeight: { xs: 548, lg: 'calc(100vh - 110px)' },
        scrollSnapAlign: 'start',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          minHeight: 32,
          pb: 0.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            width: 7,
            height: 7,
            mr: 0.75,
            flexShrink: 0,
            borderRadius: `${radius.full}px`,
            bgcolor: stage.color,
          }}
        />
        <Typography id={`sales-pipeline-stage-${stage.id}`} noWrap sx={pipelineStageLabelSx}>
          {stage.label}
        </Typography>
        <Box
          component="span"
          sx={{
            display: 'inline-grid',
            placeItems: 'center',
            minWidth: 20,
            height: 18,
            ml: 'auto',
            px: 0.625,
            borderRadius: `${radius.full}px`,
            bgcolor: stage.softColor,
            color: stage.color,
            fontSize: 10.5,
            fontWeight: 700,
          }}
        >
          {isPipelineLoading ? '-' : opportunities.length}
        </Box>
      </Stack>

      <Stack spacing={{ xs: 1.5, lg: 1.375 }} sx={{ pt: { xs: 2, lg: 1.75 } }}>
        {isPipelineLoading
          ? [0, 1].map((index) => (
              <Skeleton
                key={index}
                variant="rounded"
                height={124}
                sx={{ borderRadius: `${radius.md}px` }}
              />
            ))
          : opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                property={propertiesById.get(opportunity.imovelId)}
                density="compact"
                presentation={
                  fixtureMode ? presentationByOpportunityId.get(opportunity.id) : undefined
                }
              />
            ))}

        {!isPipelineLoading && !hasPipelineError && opportunities.length === 0 ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              minHeight: 124,
              px: 1.5,
              border: '1px dashed',
              borderColor: brand.neutral[200],
              borderRadius: `${radius.md}px`,
              bgcolor: surface.paper,
              textAlign: 'center',
            }}
          >
            <Typography color="text.secondary" sx={{ fontSize: 11.5 }}>
              Nenhuma oportunidade nesta etapa.
            </Typography>
          </Stack>
        ) : null}
      </Stack>

      <Box
        role="group"
        aria-label={`Total projetado de ${stage.label}`}
        sx={{
          mt: 'auto',
          pt: { xs: 1.25, lg: 1.5 },
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          sx={{
            color: 'text.disabled',
            fontSize: 9,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '0.01em',
            textTransform: 'uppercase',
          }}
        >
          Total projetado
        </Typography>
        {isPipelineLoading ? (
          <Skeleton width={92} />
        ) : projectedTotals.length === 0 ? (
          <Typography sx={{ mt: 0.25, fontSize: 13, fontWeight: 800, lineHeight: 1.3 }}>
            {formatCurrency(0)}
          </Typography>
        ) : (
          <Stack spacing={0.25} sx={{ mt: 0.25, minHeight: projectedTotals.length > 1 ? 36 : 0 }}>
            {projectedTotals.map((total) => (
              <Stack
                key={total.label}
                direction="row"
                alignItems="baseline"
                justifyContent="space-between"
                gap={1}
              >
                {projectedTotals.length > 1 ? (
                  <Typography sx={{ color: 'text.secondary', fontSize: 9.5, lineHeight: 1.2 }}>
                    {total.label}
                  </Typography>
                ) : null}
                <Typography sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3 }}>
                  {total.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}
