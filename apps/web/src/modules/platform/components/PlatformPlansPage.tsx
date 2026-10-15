'use client'

import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import type { SvgIconComponent } from '@mui/icons-material'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'

import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { usePlatformPlans } from '../hooks/use-platform-plans'
import type { ApiPlatformPlan } from '../types/platform-plan'
import type { TenantAccountType } from '../types/tenant'
import { EditPlatformPlanDialog } from './EditPlatformPlanDialog'

const planIcons: Record<TenantAccountType, SvgIconComponent> = {
  INDIVIDUAL: PersonOutlineRoundedIcon,
  BROKER: BadgeOutlinedIcon,
  AGENCY: ApartmentOutlinedIcon,
}

export function PlatformPlansPage() {
  const t = useTranslations('platform.plans')
  const accountT = useTranslations('platform.account')
  const format = useFormatter()
  const plansQuery = usePlatformPlans()
  const [editingPlan, setEditingPlan] = useState<ApiPlatformPlan | null>(null)
  const formatPrice = (value: number) =>
    format.number(value, { style: 'currency', currency: 'BRL' })

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Box sx={{ pb: 1.75, mb: 2.4, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography component="h1" sx={headingSx}>
          {t('title')}
        </Typography>
        <Typography sx={{ color: brand.neutral[500], fontSize: 14, mt: 0.5 }}>
          {t('subtitle')}
        </Typography>
      </Box>

      {plansQuery.isPending ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : plansQuery.isError ? (
        <Typography sx={{ color: brand.neutral[500], fontSize: 13.5 }}>{t('loadError')}</Typography>
      ) : (
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            {plansQuery.data.map((plan) => {
              const Icon = planIcons[plan.accountType]
              const unit = plan.usageUnit === 'BROKERS' ? 'Brokers' : 'Properties'

              return (
                <Stack
                  key={plan.accountType}
                  component="section"
                  aria-labelledby={`plan-${plan.accountType}-title`}
                  spacing={2}
                  sx={panelSx}
                >
                  <Stack direction="row" spacing={1.4} alignItems="center">
                    <Box aria-hidden sx={iconBoxSx}>
                      <Icon sx={{ fontSize: iconSize.xl }} />
                    </Box>
                    <Typography
                      id={`plan-${plan.accountType}-title`}
                      component="h2"
                      sx={{ color: brand.graphite[500], fontSize: 17, fontWeight: 900 }}
                    >
                      {accountT(`accountTypes.${plan.accountType}`)}
                    </Typography>
                  </Stack>
                  <Box>
                    <Typography component="span" sx={priceSx}>
                      {formatPrice(plan.monthlyPrice)}
                    </Typography>
                    <Typography component="span" sx={{ color: brand.neutral[500], fontSize: 14 }}>
                      {t('perMonth')}
                    </Typography>
                  </Box>
                  <Stack spacing={0.6} component="ul" sx={{ m: 0, pl: 2.2 }}>
                    <Typography component="li" sx={featureSx}>
                      {t(`includes${unit}`, { count: plan.includedUnits })}
                    </Typography>
                    <Typography component="li" sx={featureSx}>
                      {t(`extra${unit}`, { price: formatPrice(plan.extraUnitPrice) })}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      pt: 1.4,
                      mt: 'auto',
                      borderTop: '1px solid',
                      borderColor: alpha.graphite[6],
                    }}
                  >
                    <Typography sx={{ color: brand.neutral[500], fontSize: 12.5, fontWeight: 700 }}>
                      {t('activeAccounts', { count: plan.activeAccounts })}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      startIcon={<EditOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
                      onClick={() => setEditingPlan(plan)}
                      aria-label={t('editAction', {
                        name: accountT(`accountTypes.${plan.accountType}`),
                      })}
                    >
                      {t('edit')}
                    </Button>
                  </Stack>
                </Stack>
              )
            })}
          </Box>
          <Typography sx={{ color: brand.neutral[500], fontSize: 12.5 }}>{t('note')}</Typography>
        </Stack>
      )}

      {editingPlan ? (
        <EditPlatformPlanDialog plan={editingPlan} onClose={() => setEditingPlan(null)} />
      ) : null}
    </Box>
  )
}

const headingSx = {
  color: brand.graphite[500],
  fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
  fontSize: { xs: 26, sm: 30 },
  fontWeight: 700,
  lineHeight: 1.15,
}
const panelSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[6],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
  p: { xs: 2, md: 2.4 },
  minWidth: 0,
}
const iconBoxSx = {
  display: 'grid',
  placeItems: 'center',
  width: 40,
  height: 40,
  flexShrink: 0,
  borderRadius: `${radius.sm}px`,
  bgcolor: alpha.magenta[8],
  color: brand.magenta[500],
}
const priceSx = { color: brand.graphite[500], fontSize: 30, fontWeight: 900, mr: 0.5 }
const featureSx = { color: brand.graphite[500], fontSize: 13.5 }
