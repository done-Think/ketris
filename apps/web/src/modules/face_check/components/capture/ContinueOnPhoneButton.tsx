'use client'

import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { defaultLocale, isAppLocale } from '@/i18n/routing'
import type { ContinueOnPhoneButtonProps } from '../../types/capture.types'
import { phoneCaptureUrl } from '../../utils/phone-capture-url'
import { continueOnPhoneStyles as styles } from '../../styles/continue-on-phone.styles'

export function ContinueOnPhoneButton({ token, disabled, dark }: ContinueOnPhoneButtonProps) {
  const t = useTranslations('face_check.capture.phone')
  const currentLocale = useLocale()
  const locale = isAppLocale(currentLocale) ? currentLocale : defaultLocale
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const url =
    open && typeof window !== 'undefined'
      ? phoneCaptureUrl(window.location.href, token, locale)
      : null

  async function copy() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setCopyFailed(false)
    } catch {
      setCopyFailed(true)
    }
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<SmartphoneOutlinedIcon />}
        disabled={disabled}
        sx={dark ? styles.darkButton : undefined}
        onClick={() => {
          setCopied(false)
          setCopyFailed(false)
          setOpen(true)
        }}
      >
        {t('action')}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="continue-on-phone-title"
        data-face-check-private="true"
        className="sentry-block"
      >
        <DialogTitle id="continue-on-phone-title">{t('title')}</DialogTitle>
        <DialogContent sx={styles.content}>
          {url ? (
            <>
              <Typography>{t('instructions')}</Typography>
              <Box sx={styles.qr}>
                <QRCodeSVG value={url} size={192} role="img" aria-label={t('qrLabel')} />
              </Box>
              <TextField
                label={t('linkLabel')}
                value={url}
                fullWidth
                sx={styles.link}
                slotProps={{ input: { readOnly: true } }}
                onFocus={(event) => event.target.select()}
              />
              <Typography variant="body2">{t('privateLink')}</Typography>
              {copyFailed ? <Alert severity="info">{t('copyFailed')}</Alert> : null}
            </>
          ) : (
            <Alert severity="info">{t('unreachable')}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('close')}</Button>
          {url ? (
            <Button variant="contained" onClick={copy}>
              {copied ? t('copied') : t('copy')}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </>
  )
}
