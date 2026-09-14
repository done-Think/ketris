import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { radius, surface } from '@shared/theme/tokens'

import { useContractsStore } from '@modules/contracts/stores/contracts-store'

import { dashboardPropertyStatusStyles } from '../config/dashboard-property-ui'
import type { PropertyDetailHeaderProps } from '../types/dashboard-property'

export function PropertyDetailHeader({ property }: PropertyDetailHeaderProps) {
  const router = useRouter()
  const t = useTranslations('properties.detail')
  const statusT = useTranslations('properties.dashboard.filters')
  const status = dashboardPropertyStatusStyles[property.status]
  // Derived from the contracts store (instead of a manually-synced `activeContractId` field on the
  // property) so it can never drift: a property is only ever linked to a contract that actually
  // references it, and a newly created contract shows up here immediately.
  const activeContract = useContractsStore((state) =>
    property.status === 'Alugado'
      ? state.contracts.find((contract) => contract.propertyId === property.id)
      : undefined,
  )

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-start', md: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 2.6 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1.6} sx={{ mb: 0.7 }}>
          <Typography variant="h2" sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 900 }}>
            {property.title}
          </Typography>
          <Chip
            label={statusT(property.status)}
            sx={{
              height: 32,
              borderRadius: `${radius.full}px`,
              bgcolor: status.bgcolor,
              color: status.color,
              fontSize: 13.5,
              fontWeight: 900,
            }}
          />
        </Stack>
        <Typography sx={{ color: 'text.secondary', fontSize: { xs: 15, md: 17 } }}>
          {property.address} - {property.location}
        </Typography>
      </Box>

      <Stack direction="row" alignItems="flex-start" spacing={1.2}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<EditOutlinedIcon />}
          sx={{
            height: 46,
            px: 2.2,
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            fontSize: 15,
            fontWeight: 900,
          }}
        >
          {t('edit')}
        </Button>
        <Stack spacing={1.1}>
          <Button
            variant="contained"
            startIcon={<VisibilityOffOutlinedIcon />}
            sx={{
              height: 46,
              px: 2.4,
              borderRadius: `${radius.sm}px`,
              fontSize: 15,
              fontWeight: 900,
            }}
          >
            {t('unpublish')}
          </Button>
          {activeContract ? (
            <Button
              onClick={() =>
                router.push({
                  pathname: '/dashboard/contracts/[id]',
                  params: { id: activeContract.id },
                })
              }
              variant="outlined"
              color="secondary"
              startIcon={<ArticleOutlinedIcon />}
              sx={{
                height: 46,
                px: 2.4,
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
                fontSize: 15,
                fontWeight: 900,
              }}
            >
              {t('activeContract')}
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Stack>
  )
}
