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

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { useTenantUsers } from '../hooks/use-tenant-users'
import type { TenantUsersListProps } from '../types/tenant'

export function TenantUsersList({ tenantId }: TenantUsersListProps) {
  const t = useTranslations('platform.tenant.users')
  const formsT = useTranslations('platform.forms')
  const { data: users, isPending, isError } = useTenantUsers(tenantId)
  // On phones the four columns do not fit: each user becomes a stacked row instead.
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
      sx={{
        bgcolor: surface.paper,
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.propertyCard,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: { xs: 2, md: 2.4 },
          py: 1.8,
          borderBottom: '1px solid',
          borderColor: alpha.graphite[6],
        }}
      >
        <Typography
          id="tenant-users-title"
          component="h2"
          sx={{ color: brand.graphite[500], fontSize: 16, fontWeight: 900 }}
        >
          {t('title')}
        </Typography>
        {users ? (
          <Chip size="small" label={users.length} sx={{ fontWeight: 800, height: 22 }} />
        ) : null}
      </Stack>

      {isPending ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : isError ? (
        <Typography sx={{ color: brand.neutral[500], fontSize: 13.5, py: 6, textAlign: 'center' }}>
          {t('loadError')}
        </Typography>
      ) : users && users.length > 0 && isMobile ? (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {users.map((user) => (
            <Box
              component="li"
              key={user.id}
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: alpha.graphite[6],
                '&:last-of-type': { borderBottom: 0 },
              }}
            >
              <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 800 }}>
                {user.name}
              </Typography>
              <Typography
                sx={{ color: brand.neutral[500], fontSize: 13, overflowWrap: 'anywhere' }}
              >
                {user.email}
              </Typography>
              <Stack direction="row" spacing={0.8} sx={{ mt: 0.8 }}>
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
                  <TableCell sx={{ fontWeight: 700 }}>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{t(`roles.${user.role}`)}</TableCell>
                  <TableCell>{statusChip(user)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Stack
          alignItems="center"
          spacing={1}
          sx={{ px: 3, py: { xs: 5, md: 6 }, textAlign: 'center' }}
        >
          <Box
            aria-hidden
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 48,
              height: 48,
              mb: 0.5,
              borderRadius: radius.full,
              bgcolor: alpha.magenta[8],
              color: brand.magenta[500],
            }}
          >
            <PeopleOutlineIcon />
          </Box>
          <Typography sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
            {t('emptyTitle')}
          </Typography>
          <Typography sx={{ color: brand.neutral[500], fontSize: 13, maxWidth: 360 }}>
            {t('emptyDescription')}
          </Typography>
        </Stack>
      )}
    </Card>
  )
}
