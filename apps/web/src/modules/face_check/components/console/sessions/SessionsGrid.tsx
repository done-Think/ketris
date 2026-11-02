'use client'

import { Box, Button, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { enUS, esES, ptBR } from '@mui/x-data-grid/locales'
import { useFormatter, useLocale, useNow, useTranslations } from 'next-intl'
import { getPathname } from '@/i18n/navigation'
import { defaultLocale, isAppLocale } from '@/i18n/routing'
import { useRouter } from '@/i18n/navigation'

import { StatusBadge } from '../../ui'
import type { VerificationSession } from '../../../types'

import type { SessionsGridProps } from '../../../types/console.types'
import { sessionsPageSize } from '../../../utils/session-list-params'
import { sessionsStyles as styles } from '../../../styles/console.styles'

export function SessionsGrid({ params, rows, total, loading, onPageChange }: SessionsGridProps) {
  const currentLocale = useLocale()
  const locale = isAppLocale(currentLocale) ? currentLocale : defaultLocale
  const gridLocale = locale === 'en-US' ? enUS : locale === 'es-ES' ? esES : ptBR
  const t = useTranslations('face_check.console.sessions')
  const tDocuments = useTranslations('face_check.console.documents')
  const format = useFormatter()
  const now = useNow({ updateInterval: 60 * 1000 })
  const router = useRouter()
  const isReview = params.filter === 'review'

  const columns: GridColDef<VerificationSession>[] = [
    {
      field: 'personName',
      headerName: t('columns.person'),
      flex: 1.4,
      minWidth: 200,
      sortable: false,
      renderCell: ({ row }) => (
        <Box>
          <Typography sx={styles.personName}>{row.personName}</Typography>
          <Typography sx={styles.personRef}>{row.reference ?? t('noReference')}</Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: t('columns.status'),
      minWidth: 150,
      sortable: false,
      renderCell: ({ row }) => <StatusBadge status={row.status} />,
    },
    {
      field: 'documentType',
      headerName: t('columns.document'),
      minWidth: 120,
      sortable: false,
      valueGetter: (_value, row) =>
        row.alternativePath
          ? t('alternative')
          : tDocuments(row.documentType ?? row.acceptedDocument),
    },
    {
      field: 'createdAt',
      headerName: t('columns.createdAt'),
      minWidth: 130,
      sortable: false,
      valueFormatter: (value: string) =>
        format.dateTime(new Date(value), { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      field: 'updatedAt',
      headerName: isReview ? t('columns.waiting') : t('columns.updatedAt'),
      minWidth: 150,
      sortable: false,
      valueFormatter: (value: string) => format.relativeTime(new Date(value), now),
    },
    {
      field: 'attemptsUsed',
      headerName: t('columns.attempts'),
      minWidth: 110,
      sortable: false,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (_value, row) =>
        t('attemptsValue', { used: row.attemptsUsed, max: row.maxAttempts }),
    },
    {
      field: 'actions',
      headerName: t('columns.actions'),
      minWidth: 110,
      sortable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: ({ row }) => (
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          component="a"
          href={getPathname({
            locale,
            href: { pathname: '/dashboard/face_check/sessions/[id]', params: { id: row.id } },
          })}
          onClick={(event) => event.stopPropagation()}
        >
          {row.status === 'REVIEW' ? t('review') : t('open')}
        </Button>
      ),
    },
  ]

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      rowCount={total}
      loading={loading}
      paginationMode="server"
      paginationModel={{ page: params.page, pageSize: sessionsPageSize }}
      onPaginationModelChange={(model) => onPageChange(model.page)}
      pageSizeOptions={[sessionsPageSize]}
      rowHeight={64}
      autoHeight
      disableColumnMenu
      disableColumnResize
      disableRowSelectionOnClick
      onRowClick={({ row }) =>
        router.push({ pathname: '/dashboard/face_check/sessions/[id]', params: { id: row.id } })
      }
      localeText={{
        ...gridLocale.components.MuiDataGrid.defaultProps.localeText,
        noRowsLabel: params.filter === 'all' && !params.search ? t('emptyAll') : t('empty'),
      }}
      sx={styles.grid}
    />
  )
}
