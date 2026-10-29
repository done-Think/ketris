'use client'

import { styles } from '../../styles/contract-documents-panel.styles'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import { Alert, Box, IconButton, Stack, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import type { ContractDocumentsPanelProps } from '../../types/detail'
import { ContractDetailPanel } from './ContractDetailPanel'
import { useDownloadContractDocument } from '../../hooks/use-contract-documents'
import { contractError } from '../../utils/contract-error'

export function ContractDocumentsPanel({
  documents,
  dataRevision,
  contractId,
}: ContractDocumentsPanelProps) {
  const t = useTranslations('contracts.documents')
  const errors = useTranslations('contracts.errors')
  const formatter = useFormatter()
  const download = useDownloadContractDocument(contractId)
  return (
    <ContractDetailPanel title={t('title')} sx={styles.contractDetailPanel}>
      <Stack spacing={1.6} sx={styles.stack}>
        {download.isError && (
          <Alert severity="error">{contractError(download.error, errors)}</Alert>
        )}
        {!documents.length && <Typography>{t('empty')}</Typography>}
        {documents.map((document) => (
          <Stack key={document.id} spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1.3} sx={styles.stack2}>
              <ArticleOutlinedIcon sx={styles.articleOutlinedIcon} />
              <Box sx={styles.box}>
                <Typography noWrap sx={styles.typography}>
                  {document.name}
                </Typography>
                <Typography sx={styles.typography2}>
                  {formatter.dateTime(new Date(document.createdAt), { dateStyle: 'short' })}
                  {document.uploadedBy ? ' · ' + document.uploadedBy.name : ''}
                </Typography>
              </Box>
              <IconButton
                aria-label={t('download', { name: document.name })}
                disabled={!document.canDownload || download.isPending}
                onClick={() =>
                  download.mutate(document.id, {
                    onSuccess: ({ url }) => window.location.assign(url),
                  })
                }
                sx={styles.iconButton}
              >
                <DownloadOutlinedIcon sx={styles.downloadOutlinedIcon} />
              </IconButton>
            </Stack>
            {!document.canDownload && <Typography variant="body2">{t('legacy')}</Typography>}
            {document.contractRevision !== dataRevision && (
              <Typography variant="body2">{t('outdated')}</Typography>
            )}
          </Stack>
        ))}
      </Stack>
    </ContractDetailPanel>
  )
}
