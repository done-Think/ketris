import { Box, Skeleton, Stack, Typography } from '@mui/material'

import { brand, componentText, radius, surface } from '@shared/theme/tokens'

import type { PipelineStageColumnProps } from '../../types/sales-pipeline'
import { formatCurrency } from '../../utils/formatters'
import { OpportunityCard } from '../OpportunityCard'

const pipelineStageLabelSx = {
  ...componentText.cardMeta,
  fontWeight: 700,
  lineHeight: '16px',
  letterSpacing: '0.04em',
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
          minHeight: 40,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            width: 8,
            height: 8,
            mr: 1,
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
            minWidth: 24,
            height: 22,
            ml: 'auto',
            px: 1,
            borderRadius: `${radius.full}px`,
            bgcolor: stage.softColor,
            color: stage.color,
            fontSize: componentText.cardMeta.fontSize,
            fontWeight: 700,
          }}
        >
          {isPipelineLoading ? '-' : opportunities.length}
        </Box>
      </Stack>

      <Stack spacing={2} sx={{ pt: 2 }}>
        {isPipelineLoading
          ? [0, 1].map((index) => (
              <Skeleton
                key={index}
                variant="rounded"
                height={148}
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
              minHeight: 148,
              px: 1.5,
              border: '1px dashed',
              borderColor: brand.neutral[200],
              borderRadius: `${radius.md}px`,
              bgcolor: surface.paper,
              textAlign: 'center',
            }}
          >
            <Typography color="text.secondary" sx={componentText.cardMeta}>
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
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          sx={{
            color: 'text.disabled',
            ...componentText.cardEyebrow,
            fontWeight: 700,
            lineHeight: '16px',
            letterSpacing: '0.04em',
          }}
        >
          Total projetado
        </Typography>
        {isPipelineLoading ? (
          <Skeleton width={92} />
        ) : projectedTotals.length === 0 ? (
          <Typography sx={{ mt: 0.5, fontSize: 16, fontWeight: 900, lineHeight: 1.3 }}>
            {formatCurrency(0)}
          </Typography>
        ) : (
          <Stack spacing={0.25} sx={{ mt: 0.5, minHeight: projectedTotals.length > 1 ? 44 : 0 }}>
            {projectedTotals.map((total) => (
              <Stack
                key={total.label}
                direction="row"
                alignItems="baseline"
                justifyContent="space-between"
                gap={1}
              >
                {projectedTotals.length > 1 ? (
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: componentText.cardMeta.fontSize,
                      lineHeight: 1.3,
                    }}
                  >
                    {total.label}
                  </Typography>
                ) : null}
                <Typography sx={{ fontSize: 16, fontWeight: 900, lineHeight: 1.3 }}>
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
