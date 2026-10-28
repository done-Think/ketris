'use client'

import { useState } from 'react'
import { Alert, Button, CircularProgress, Pagination, Stack, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { useContractHistory } from '../../hooks/use-contracts'
import { ContractDetailPanel } from './ContractDetailPanel'
import type { ContractHistoryPanelProps } from '../../types/workflow'
import { contractHistoryFields } from '../../utils/contract-history-fields'
import { contractError } from '../../utils/contract-error'

export function ContractHistoryPanel({ contractId }: ContractHistoryPanelProps) {
  const t = useTranslations('contracts.history')
  const errors = useTranslations('contracts.errors')
  const formatter = useFormatter()
  const [page, setPage] = useState(1)
  const query = useContractHistory(contractId, page, true)
  return (
    <ContractDetailPanel title={t('title')}>
      <Stack spacing={2}>
        {query.isPending && <CircularProgress size={24} />}
        {query.isError && (
          <Alert
            severity="error"
            action={<Button onClick={() => query.refetch()}>{t('retry')}</Button>}
          >
            {contractError(query.error, errors)}
          </Alert>
        )}
        {query.data?.items.map((entry) => (
          <Stack key={entry.id} spacing={0.5}>
            <Typography variant="subtitle2">{t(`actions.${entry.action}`)}</Typography>
            <Typography variant="body2">
              {formatter.dateTime(new Date(entry.createdAt), {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </Typography>
            <Typography variant="body2">
              {entry.actor?.name ?? t(entry.actorType === 'SYSTEM' ? 'system' : 'unavailableActor')}
            </Typography>
            {entry.changedFields.length > 0 && (
              <Typography variant="body2">
                {t('changes', { fields: contractHistoryFields(entry.changedFields, t) })}
              </Typography>
            )}
            {entry.reason && <Typography variant="body2">{entry.reason}</Typography>}
          </Stack>
        ))}
        {query.data?.totalCount === 0 && <Typography>{t('empty')}</Typography>}
        {Boolean(query.data && query.data.totalCount > 10) && (
          <Pagination
            page={page}
            count={Math.ceil((query.data?.totalCount ?? 0) / 10)}
            onChange={(_event, value) => setPage(value)}
            aria-label={t('pagination')}
            getItemAriaLabel={(type, value) =>
              type === 'page'
                ? t('page', { page: value ?? 1 })
                : t(
                    type === 'first'
                      ? 'navigation.first'
                      : type === 'last'
                        ? 'navigation.last'
                        : type === 'previous'
                          ? 'navigation.previous'
                          : 'navigation.next',
                  )
            }
          />
        )}
      </Stack>
    </ContractDetailPanel>
  )
}
