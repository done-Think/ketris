import { Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useCrmFormatter } from '../../hooks/use-crm-formatter'
import * as crmStyles from '../../styles/pipeline-stage-column.styles'

import type { PipelineStageColumnProps } from '../../types/sales-pipeline'
import { OpportunityCard } from '../OpportunityCard'

export function PipelineStageColumn({
  stage,
  opportunities,
  projectedTotals,
  isPipelineLoading,
  hasPipelineError,
  propertiesById,
  totalCount = opportunities.length,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: PipelineStageColumnProps) {
  const format = useCrmFormatter()
  const t = useTranslations('crm.pipeline')
  const stageLabel = t(`stages.${stage.labelKey}`)

  return (
    <Stack
      component="section"
      role="region"
      aria-labelledby={`sales-pipeline-stage-${stage.id}`}
      sx={crmStyles.stackSx}
    >
      <Stack direction="row" alignItems="center" sx={crmStyles.stackSx2}>
        <Box aria-hidden="true" sx={crmStyles.getBoxSx(stage)} />
        <Typography
          id={`sales-pipeline-stage-${stage.id}`}
          noWrap
          sx={crmStyles.pipelineStageLabelSx}
        >
          {stageLabel}
        </Typography>
        <Box component="span" sx={crmStyles.getBoxSx2(stage)}>
          {isPipelineLoading ? '-' : totalCount}
        </Box>
      </Stack>

      <Stack spacing={{ xs: 1.5, lg: 1.375 }} sx={crmStyles.stackSx3}>
        {isPipelineLoading
          ? [0, 1].map((index) => (
              <Skeleton key={index} variant="rounded" height={124} sx={crmStyles.skeletonSx} />
            ))
          : opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                property={propertiesById.get(opportunity.propertyId)}
                density="compact"
              />
            ))}

        {!isPipelineLoading && !hasPipelineError && opportunities.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" sx={crmStyles.stackSx4}>
            <Typography color="text.secondary" sx={crmStyles.typographySx}>
              {t('emptyStage')}
            </Typography>
          </Stack>
        ) : null}
      </Stack>

      {hasNextPage && (
        <Button onClick={onLoadMore} disabled={isFetchingNextPage}>
          {t('loadMore')}
        </Button>
      )}

      <Box
        role="group"
        aria-label={t('projectedTotalAriaLabel', { stage: stageLabel })}
        sx={crmStyles.boxSx}
      >
        <Typography sx={crmStyles.typographySx2}>{t('projectedTotal')}</Typography>
        {isPipelineLoading ? (
          <Skeleton width={92} />
        ) : projectedTotals.length === 0 ? (
          <Typography sx={crmStyles.typographySx3}>{format.money(0)}</Typography>
        ) : (
          <Stack spacing={0.25} sx={crmStyles.getStackSx(projectedTotals)}>
            {projectedTotals.map((total) => (
              <Stack
                key={total.labelKey}
                direction="row"
                alignItems="baseline"
                justifyContent="space-between"
                gap={1}
              >
                {projectedTotals.length > 1 ? (
                  <Typography sx={crmStyles.typographySx4}>
                    {t(`totalLabels.${total.labelKey}`)}
                  </Typography>
                ) : null}
                <Typography sx={crmStyles.typographySx5}>{total.value}</Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}
