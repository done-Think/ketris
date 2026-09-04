'use client'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

import type { LeadContactDialogProps } from '../types/lead'

function getPhoneDigits(phone: string) {
  return phone.replace(/\D/g, '')
}

function getWhatsAppUrl(phone: string) {
  const phoneDigits = getPhoneDigits(phone)
  const brazilCountryCode = '55'
  const internationalPhone = phoneDigits.startsWith(brazilCountryCode)
    ? phoneDigits
    : `${brazilCountryCode}${phoneDigits}`

  return `https://wa.me/${internationalPhone}`
}

export function LeadContactDialog({ lead, onClose, open }: LeadContactDialogProps) {
  const t = useTranslations('crm.leads.contact')

  if (!lead) return null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ px: { xs: 2, md: 2.6 }, pb: 1, pt: 2.4 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: brand.magenta[600], fontSize: 13, fontWeight: 900 }}>
              {t('eyebrow')}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
              {lead.name}
            </Typography>
          </Box>
          <IconButton aria-label={t('close')} onClick={onClose}>
            <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2, md: 2.6 }, pb: 2 }}>
        <Stack spacing={1.6}>
          <Box
            sx={{
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.app,
              p: 1.6,
            }}
          >
            <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 800 }}>
              {t('phoneLabel')}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
              {lead.phone}
            </Typography>
          </Box>

          <Box
            sx={{
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              p: 1.6,
            }}
          >
            <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 800 }}>
              {t('emailLabel')}
            </Typography>
            <Typography
              sx={{
                color: brand.graphite[500],
                fontSize: 16,
                fontWeight: 900,
                overflowWrap: 'anywhere',
              }}
            >
              {lead.email}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
            <Button
              component="a"
              href={`tel:${getPhoneDigits(lead.phone)}`}
              variant="contained"
              fullWidth
              startIcon={<PhoneRoundedIcon sx={{ fontSize: iconSize.sm }} />}
              sx={{ borderRadius: `${radius.sm}px`, fontWeight: 900 }}
            >
              {t('call')}
            </Button>
            <Button
              component="a"
              href={`mailto:${lead.email}`}
              variant="outlined"
              fullWidth
              startIcon={<EmailRoundedIcon sx={{ fontSize: iconSize.sm }} />}
              sx={{ borderRadius: `${radius.sm}px`, fontWeight: 900 }}
            >
              {t('email')}
            </Button>
            <Button
              component="a"
              href={getWhatsAppUrl(lead.phone)}
              target="_blank"
              rel="noreferrer"
              variant="outlined"
              fullWidth
              startIcon={<WhatsAppIcon sx={{ fontSize: iconSize.sm }} />}
              sx={{ borderRadius: `${radius.sm}px`, fontWeight: 900 }}
            >
              {t('whatsApp')}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, md: 2.6 }, pb: 2.4, pt: 0 }}>
        <Button type="button" variant="outlined" color="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
