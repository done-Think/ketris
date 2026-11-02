'use client'

import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import { Alert, Box, Button, DialogActions, DialogContent, Typography } from '@mui/material'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { defaultLocale, isAppLocale } from '@/i18n/routing'
import { Link, getPathname } from '@/i18n/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'

import { brand } from '../../../styles/tokens'

import type { CreatedLinkPanelProps } from '../../../types/console.types'
import { dialogStyles as styles } from '../../../styles/console.styles'

export function CreatedLinkPanel({ created, onClose }: CreatedLinkPanelProps) {
  const t = useTranslations('face_check.console.newVerification')
  const format = useFormatter()
  const [copied, setCopied] = useState(false)
  const currentLocale = useLocale()
  const locale = isAppLocale(currentLocale) ? currentLocale : defaultLocale
  const { session } = created
  const path = getPathname({
    locale,
    href: { pathname: '/face_check/verify/[token]', params: { token: session.token } },
  })
  const url = new URL(path, created.captureUrl).href

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      <DialogContent sx={styles.content}>
        <Box sx={styles.created}>
          <Box sx={styles.qr} role="img" aria-label={t('qrLabel')}>
            <QRCodeSVG value={url} size={148} fgColor={brand.graphite[500]} />
          </Box>
          <Box sx={styles.createdBody}>
            <Typography>{t('createdBody', { name: session.personName })}</Typography>
            <Box sx={styles.linkBox}>
              <Typography component="span" sx={styles.linkText}>
                {url}
              </Typography>
              <Button size="small" variant="contained" color="secondary" onClick={copy}>
                {copied ? t('copied') : t('copy')}
              </Button>
            </Box>
            <Typography component="span" sx={styles.meta}>
              <ScheduleRoundedIcon fontSize="inherit" />
              {t('expiresAt', {
                date: format.dateTime(new Date(session.expiresAt), {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }),
              })}
            </Typography>
          </Box>
        </Box>
        {session.contact ? (
          <Alert severity="info">{t('invitationEmailNotice', { email: session.contact })}</Alert>
        ) : null}
        <Alert severity="info">{t('networkNotice')}</Alert>
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button
          variant="outlined"
          color="secondary"
          component="a"
          href={url}
          target="_blank"
          rel="noopener"
        >
          {t('openAsPerson')}
        </Button>
        <Button
          variant="contained"
          component={Link}
          href="/dashboard/face_check/sessions"
          onClick={onClose}
        >
          {t('goToSessions')}
        </Button>
      </DialogActions>
    </>
  )
}
