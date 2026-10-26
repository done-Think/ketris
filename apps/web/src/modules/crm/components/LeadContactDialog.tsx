'use client'

import * as crmStyles from '../styles/lead-contact-dialog.styles'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { leadStageOptions } from '../config/lead-creation'
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

export function LeadContactDialog({
  lead,
  onClose,
  open,
  onStageChange,
  onConvertRequest,
}: LeadContactDialogProps) {
  const t = useTranslations('crm.leads.contact')
  const tFilters = useTranslations('crm.leads.filters')

  if (!lead) return null

  const isConverted = Boolean(lead.opportunityId)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={crmStyles.dialogTitleSx}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Stack spacing={1.4} sx={crmStyles.stackSx}>
            <Box sx={crmStyles.boxSx}>
              <Typography sx={crmStyles.typographySx}>{t('eyebrow')}</Typography>
              <Typography sx={crmStyles.typographySx2}>{lead.name}</Typography>
            </Box>
            <TextField
              select
              fullWidth
              label={t('stageLabel')}
              value={lead.stage}
              disabled={isConverted}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) => {
                const nextStage = event.target.value as (typeof leadStageOptions)[number]['value']
                onStageChange(lead.id, nextStage)
              }}
            >
              {leadStageOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {tFilters(option.labelKey)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <IconButton aria-label={t('close')} onClick={onClose}>
            <CloseRoundedIcon sx={crmStyles.closeRoundedIconSx} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={crmStyles.dialogContentSx}>
        <Stack spacing={1.6}>
          <Box sx={crmStyles.boxSx2}>
            <Typography sx={crmStyles.typographySx3}>{t('phoneLabel')}</Typography>
            <Typography sx={crmStyles.typographySx2}>{lead.phone}</Typography>
          </Box>

          <Box sx={crmStyles.boxSx3}>
            <Typography sx={crmStyles.typographySx3}>{t('emailLabel')}</Typography>
            <Typography sx={crmStyles.typographySx4}>{lead.email}</Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
            <Button
              component="a"
              href={`tel:${getPhoneDigits(lead.phone)}`}
              variant="contained"
              fullWidth
              startIcon={<PhoneRoundedIcon sx={crmStyles.phoneRoundedIconSx} />}
              sx={crmStyles.buttonSx}
            >
              {t('call')}
            </Button>
            <Button
              component="a"
              href={`mailto:${lead.email}`}
              variant="outlined"
              fullWidth
              startIcon={<EmailRoundedIcon sx={crmStyles.phoneRoundedIconSx} />}
              sx={crmStyles.buttonSx}
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
              startIcon={<WhatsAppIcon sx={crmStyles.phoneRoundedIconSx} />}
              sx={crmStyles.buttonSx}
            >
              {t('whatsApp')}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={crmStyles.dialogActionsSx}>
        <Button type="button" variant="outlined" color="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={isConverted}
          startIcon={<SwapHorizRoundedIcon sx={crmStyles.phoneRoundedIconSx} />}
          onClick={() => onConvertRequest(lead)}
        >
          {isConverted ? t('alreadyConverted') : t('convert')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
