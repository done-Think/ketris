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
import { useLocale, useTranslations } from 'next-intl'

import type { AppLocale } from '@/i18n/types/locale.types'

import { formatCurrency } from '@shared/lib/utils/format'

import type { ActivityDetailModalProps } from '../types/dashboard-overview'
import { ContactInfoCard } from './ContactInfoCard'
import { styles } from '../styles/activity-detail-modal.styles'

export function ActivityDetailModal({ activity, onClose }: ActivityDetailModalProps) {
  const t = useTranslations('dashboard.overview.activityDetail')
  const locale = useLocale() as AppLocale
  const property = activity?.property ?? null

  return (
    <Dialog
      open={Boolean(activity)}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: styles.paper,
        },
      }}
    >
      {activity ? (
        <>
          <DialogTitle sx={styles.dialogTitle}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={styles.box}>
                <Typography sx={styles.typography}>{activity.contact}</Typography>
                <Typography noWrap sx={styles.typography2}>
                  {activity.title}
                </Typography>
              </Box>
              <IconButton aria-label={t('close')} onClick={onClose} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={styles.dialogContent}>
            <Stack spacing={1.4}>
              <Box sx={styles.box2}>
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <AccessTimeOutlinedIcon sx={styles.accessTimeOutlinedIcon} />
                    <Box>
                      <Typography sx={styles.typography}>{t('meetingTime')}</Typography>
                      <Typography sx={styles.typography3}>{activity.meetingTime}</Typography>
                    </Box>
                  </Stack>

                  {activity.propertyReference ? (
                    <>
                      <Divider />
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <HomeWorkOutlinedIcon sx={styles.accessTimeOutlinedIcon} />
                        <Box>
                          <Typography sx={styles.typography}>{t('location')}</Typography>
                          <Typography sx={styles.typography4}>
                            {activity.propertyReference}
                          </Typography>
                        </Box>
                      </Stack>
                    </>
                  ) : null}
                </Stack>
              </Box>

              <ContactInfoCard label={t('client')} name={activity.contact} phone={activity.phone} />

              <Box sx={styles.box2}>
                <Typography sx={styles.typography}>{t('notes')}</Typography>
                <Typography sx={styles.typography5}>{activity.notes || t('noNotes')}</Typography>
              </Box>

              {property ? (
                <Box sx={styles.box3}>
                  <Stack direction="row" alignItems="center" spacing={0.8}>
                    <HomeWorkOutlinedIcon sx={styles.homeWorkOutlinedIcon} />
                    <Typography sx={styles.typography}>{t('visitProperty')}</Typography>
                  </Stack>
                  <Typography sx={styles.typography6}>{property.title}</Typography>
                  {property.address ? (
                    <Typography sx={styles.typography7}>{property.address}</Typography>
                  ) : null}
                  <Typography sx={styles.typography8}>
                    {formatCurrency(property.price, locale)}
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
