'use client'

import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import {
  Box,
  Card,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslations } from 'next-intl'

import { DashboardTablePagination } from '@shared/components/layout'
import { useListState } from '@shared/hooks/use-list-state'

import { tenantUsersPageSizeOptions } from '../config/platform-lists'
import { useTenantUsers } from '../hooks/use-tenants'
import type { TenantUsersListProps, TenantUsersListState } from '../types/tenant'
import { styles } from '../styles/tenant-users-list.styles'

export function TenantUsersList({ tenantId }: TenantUsersListProps) {
  const t = useTranslations('platform.tenant.users')
  const formsT = useTranslations('platform.forms')
  const { filters, updateFilters } = useListState<TenantUsersListState>({
    page: 1,
    pageSize: tenantUsersPageSizeOptions[0],
  })
  const { data, isPending, isError } = useTenantUsers(tenantId, filters.page, filters.pageSize)
  const users = data?.users
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const statusChip = (user: NonNullable<typeof users>[number]) =>
    user.pendingApproval ? (
      <Chip label={t('pendingApproval')} color="warning" size="small" />
    ) : (
      <Chip
        label={user.active ? formsT('active') : formsT('inactive')}
        color={user.active ? 'success' : 'default'}
        size="small"
      />
    )

  return (
    <Card
      component="section"
      aria-labelledby="tenant-users-title"
      variant="outlined"
      sx={styles.card}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={styles.stack}>
        <Typography id="tenant-users-title" component="h2" sx={styles.typography}>
          {t('title')}
        </Typography>
        {data ? <Chip size="small" label={data.totalCount} sx={styles.chip} /> : null}
      </Stack>

      {isPending ? (
        <Stack alignItems="center" sx={styles.stack2}>
          <CircularProgress size={28} />
        </Stack>
      ) : isError ? (
        <Typography sx={styles.typography2}>{t('loadError')}</Typography>
      ) : users && users.length > 0 && isMobile ? (
        <Box component="ul" sx={styles.box}>
          {users.map((user) => (
            <Box component="li" key={user.id} sx={styles.box2}>
              <Typography sx={styles.typography3}>{user.name}</Typography>
              <Typography sx={styles.typography4}>{user.email}</Typography>
              <Stack direction="row" spacing={0.8} sx={styles.stack3}>
                <Chip label={t(`roles.${user.role}`)} variant="outlined" size="small" />
                {statusChip(user)}
              </Stack>
            </Box>
          ))}
        </Box>
      ) : users && users.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{formsT('name')}</TableCell>
                <TableCell>{formsT('email')}</TableCell>
                <TableCell>{formsT('role')}</TableCell>
                <TableCell>{formsT('status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell sx={styles.tableCell}>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{t(`roles.${user.role}`)}</TableCell>
                  <TableCell>{statusChip(user)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Stack alignItems="center" spacing={1} sx={styles.stack4}>
          <Box aria-hidden sx={styles.box3}>
            <PeopleOutlineIcon />
          </Box>
          <Typography sx={styles.typography5}>{t('emptyTitle')}</Typography>
          <Typography sx={styles.typography6}>{t('emptyDescription')}</Typography>
        </Stack>
      )}
      {data && data.totalCount > data.pageSize ? (
        <DashboardTablePagination
          count={data.totalCount}
          page={filters.page}
          rowsPerPage={filters.pageSize}
          rowsPerPageOptions={[...tenantUsersPageSizeOptions]}
          onPageChange={(page) => updateFilters({ page })}
          onRowsPerPageChange={(pageSize) => updateFilters({ page: 1, pageSize })}
        />
      ) : null}
    </Card>
  )
}
