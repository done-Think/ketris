'use client'

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import CloseIcon from '@mui/icons-material/Close'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import { useTranslations } from 'next-intl'

import { formatCurrency } from '@shared/lib/utils/format'
import { alpha, brand, radius } from '@shared/theme/tokens'

import { useCrmProperty } from '@modules/crm/hooks/use-opportunities'
import type { PublicPropertyAddress } from '@modules/crm/types/property'

import type { ActivityDetailModalProps } from '../types/dashboard-overview'
import { ContactInfoCard } from './ContactInfoCard'

function formatPropertyAddress(address: PublicPropertyAddress | null) {
  if (!address) return null

  return `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}`
}

export function ActivityDetailModal({ activity, tenantId, onClose }: ActivityDetailModalProps) {
  const t = useTranslations('dashboard.overview.activityDetail')
  const propertyQuery = useCrmProperty(tenantId, activity?.propertyId)
  const property = propertyQuery.data
  const propertyAddress = property ? formatPropertyAddress(property.address) : null

  return (
    <Dialog
      open={Boolean(activity)}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${radius.sm}px`,
            overflow: 'hidden',
          },
        },
      }}
    >
      {activity ? (
        <>
          <DialogTitle sx={{ px: { xs: 2, md: 2.6 }, py: 2 }}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
                  {activity.contact}
                </Typography>
                <Typography
                  noWrap
                  sx={{ color: brand.graphite[500], fontSize: { xs: 20, md: 24 }, fontWeight: 900 }}
                >
                  {activity.title}
                </Typography>
              </Box>
              <IconButton aria-label={t('close')} onClick={onClose} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ px: { xs: 2, md: 2.6 }, pb: 2.6 }}>
            <Stack spacing={1.4}>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: alpha.graphite[6],
                  borderRadius: `${radius.sm}px`,
                  p: 1.6,
                }}
              >
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <AccessTimeOutlinedIcon sx={{ color: brand.magenta[500], fontSize: 19 }} />
                    <Box>
                      <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
                        {t('meetingTime')}
                      </Typography>
                      <Typography
                        sx={{ color: brand.graphite[500], fontSize: 16, fontWeight: 900 }}
                      >
                        {activity.meetingTime}
                      </Typography>
                    </Box>
                  </Stack>

                  {activity.propertyReference ? (
                    <>
                      <Divider />
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <HomeWorkOutlinedIcon sx={{ color: brand.magenta[500], fontSize: 19 }} />
                        <Box>
                          <Typography
                            sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}
                          >
                            {t('location')}
                          </Typography>
                          <Typography
                            sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}
                          >
                            {activity.propertyReference}
                          </Typography>
                        </Box>
                      </Stack>
                    </>
                  ) : null}
                </Stack>
              </Box>

              <ContactInfoCard label={t('client')} name={activity.contact} phone={activity.phone} />

              <Box
                sx={{
                  border: '1px solid',
                  borderColor: alpha.graphite[6],
                  borderRadius: `${radius.sm}px`,
                  p: 1.6,
                }}
              >
                <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
                  {t('notes')}
                </Typography>
                <Typography
                  sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 700, mt: 0.6 }}
                >
                  {activity.notes || t('noNotes')}
                </Typography>
              </Box>

              {property ? (
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: alpha.graphite[6],
                    borderRadius: `${radius.sm}px`,
                    p: 1.6,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.8}>
                    <HomeWorkOutlinedIcon sx={{ color: brand.magenta[500], fontSize: 18 }} />
                    <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
                      {t('visitProperty')}
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{ color: brand.graphite[500], fontSize: 16, fontWeight: 900, mt: 0.8 }}
                  >
                    {property.title}
                  </Typography>
                  {propertyAddress ? (
                    <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
                      {propertyAddress}
                    </Typography>
                  ) : null}
                  <Typography
                    sx={{ color: brand.magenta[600], fontSize: 14, fontWeight: 900, mt: 0.6 }}
                  >
                    {formatCurrency(property.price)}
                  </Typography>
                </Box>
              ) : null}
            </Stack>
          </DialogContent>
        </>
      ) : null}
    </Dialog>
  )
}
