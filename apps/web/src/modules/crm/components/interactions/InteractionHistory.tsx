'use client'

import { Alert, Button, Chip, CircularProgress, Pagination, Stack, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useInteractions } from '../../hooks/use-interactions'
import type { InteractionHistoryProps } from '../../types/interaction'
import { interactionStyles as styles } from '../../styles/interaction.styles'
import { leadStageOptions } from '../../config/lead-creation'
import { InteractionResultForm } from './InteractionResultForm'

export function InteractionHistory({ target }: InteractionHistoryProps) {
  const t = useTranslations('crm.interactions')
  const format = useFormatter()
  const stages = useTranslations('crm.leads.filters')
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const query = useInteractions(target, page)
  const stageLabel = (stage: string) => {
    const option = leadStageOptions.find((candidate) => candidate.value === stage)
    return option ? stages(option.labelKey) : stage
  }
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography variant="subtitle1" sx={styles.heading}>
          {t('title')}
        </Typography>
        <Button size="small" disabled={query.isFetching} onClick={() => void query.refetch()}>
          {t('refreshHistory')}
        </Button>
      </Stack>
      {query.isLoading && <CircularProgress size={24} aria-label={t('loading')} />}
      {query.isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => void query.refetch()}>{t('retry')}</Button>}
        >
          {t('loadError')}
        </Alert>
      )}
      {query.data && !query.data.interactions.length && (
        <Typography color="text.secondary">{t('empty')}</Typography>
      )}
      {query.data?.interactions.map((interaction) => (
        <Stack key={interaction.id} spacing={1} sx={styles.item}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="subtitle2">
              {interaction.channel
                ? t(`channels.${interaction.channel}`)
                : t(`kinds.${interaction.kind ?? 'CONTACT_ATTEMPT'}`)}
            </Typography>
            {interaction.status && (
              <Chip
                size="small"
                label={t(`statuses.${interaction.status}`)}
                color={
                  interaction.status === 'CONTACT_MADE'
                    ? 'success'
                    : interaction.status === 'STARTED'
                      ? 'info'
                      : 'default'
                }
              />
            )}
          </Stack>
          <Typography variant="body2" sx={styles.metadata}>
            {interaction.actorName}
            {' \u00b7 '}
            {format.dateTime(new Date(interaction.createdAt), {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </Typography>
          {target.kind !== 'lead' && interaction.leadName && (
            <Typography variant="body2">{interaction.leadName}</Typography>
          )}
          {interaction.previousStage && interaction.nextStage && (
            <Typography variant="body2">
              {stageLabel(interaction.previousStage)}
              {' \u2192 '}
              {stageLabel(interaction.nextStage)}
            </Typography>
          )}
          {interaction.description && (
            <Typography variant="body2" sx={styles.description}>
              {interaction.description}
            </Typography>
          )}
          {interaction.completedAt && (
            <Typography variant="caption" sx={styles.metadata}>
              {t('completedAt', {
                date: format.dateTime(new Date(interaction.completedAt), {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }),
              })}
            </Typography>
          )}
          {interaction.canComplete &&
            (editingId === interaction.id ? (
              <InteractionResultForm
                interaction={interaction}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <Button size="small" onClick={() => setEditingId(interaction.id)}>
                {t('recordResult')}
              </Button>
            ))}
        </Stack>
      ))}
      {query.data && query.data.pagination.pageCount > 1 && (
        <Pagination
          page={query.data.pagination.page}
          count={query.data.pagination.pageCount}
          onChange={(_, value) => setPage(value)}
          aria-label={t('pagination')}
        />
      )}
    </Stack>
  )
}
