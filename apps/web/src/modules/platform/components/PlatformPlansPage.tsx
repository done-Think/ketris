'use client'

import { formatCurrency } from '@shared/lib/utils/format'

import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'

import { usePlatformActor } from '../hooks/use-platform-actor'
import { usePlatformPlans } from '../hooks/use-platform-billing'
import type { ApiPlatformPlan } from '../types/platform-plan'
import { accountTypeIcons } from '../utils/account-type-icons'
import { EditPlatformPlanDialog } from './EditPlatformPlanDialog'
import { styles } from '../styles/platform-plans-page.styles'

export function PlatformPlansPage() {
  const t = useTranslations('platform.plans')
  const accountT = useTranslations('platform.account')
  const format = useFormatter()
  const plansQuery = usePlatformPlans()
  const [editingPlan, setEditingPlan] = useState<ApiPlatformPlan | null>(null)
  const { canManage } = usePlatformActor()
  const formatPrice = (value: number) => formatCurrency(value, format.number)

  return (
    <Box sx={styles.box}>
      <Box sx={styles.box2}>
        <Typography component="h1" sx={styles.heading}>
          {t('title')}
        </Typography>
        <Typography sx={styles.typography}>{t('subtitle')}</Typography>
      </Box>

      {plansQuery.isPending ? (
        <Stack alignItems="center" sx={styles.stack}>
          <CircularProgress size={28} />
        </Stack>
      ) : plansQuery.isError ? (
        <Typography sx={styles.typography2}>{t('loadError')}</Typography>
      ) : (
        <Stack spacing={2}>
          <Box sx={styles.box3}>
            {plansQuery.data.map((plan) => {
              const Icon = accountTypeIcons[plan.accountType]
              const unit = plan.usageUnit === 'BROKERS' ? 'Brokers' : 'Properties'

              return (
                <Stack
                  key={plan.accountType}
                  component="section"
                  aria-labelledby={`plan-${plan.accountType}-title`}
                  spacing={2}
                  sx={styles.panel}
                >
                  <Stack direction="row" spacing={1.4} alignItems="center">
                    <Box aria-hidden sx={styles.iconBox}>
                      <Icon sx={styles.icon} />
                    </Box>
                    <Typography
                      id={`plan-${plan.accountType}-title`}
                      component="h2"
                      sx={styles.typography3}
                    >
                      {accountT(`accountTypes.${plan.accountType}`)}
                    </Typography>
                  </Stack>
                  <Box>
                    <Typography component="span" sx={styles.price}>
                      {formatPrice(plan.monthlyPrice)}
                    </Typography>
                    <Typography component="span" sx={styles.typography4}>
                      {t('perMonth')}
                    </Typography>
                  </Box>
                  <Stack spacing={0.6} component="ul" sx={styles.stack2}>
                    <Typography component="li" sx={styles.feature}>
                      {t(`includes${unit}`, { count: plan.includedUnits })}
                    </Typography>
                    <Typography component="li" sx={styles.feature}>
                      {t(`extra${unit}`, { price: formatPrice(plan.extraUnitPrice) })}
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={styles.stack3}
                  >
                    <Box>
                      <Typography sx={styles.typography5}>
                        {t('activeAccounts', { count: plan.activeAccounts })}
                      </Typography>
                      {plan.updatedBy ? (
                        <Typography sx={styles.typography5}>
                          {t('updatedBy', {
                            name: plan.updatedBy.name,
                            date: format.dateTime(new Date(plan.updatedAt), { dateStyle: 'short' }),
                          })}
                        </Typography>
                      ) : null}
                    </Box>
                    {canManage ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        startIcon={<EditOutlinedIcon sx={styles.editOutlinedIcon} />}
                        onClick={() => setEditingPlan(plan)}
                        aria-label={t('editAction', {
                          name: accountT(`accountTypes.${plan.accountType}`),
                        })}
                      >
                        {t('edit')}
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
              )
            })}
          </Box>
          <Typography sx={styles.typography6}>{t('note')}</Typography>
        </Stack>
      )}

      {editingPlan && canManage ? (
        <EditPlatformPlanDialog plan={editingPlan} onClose={() => setEditingPlan(null)} />
      ) : null}
    </Box>
  )
}
