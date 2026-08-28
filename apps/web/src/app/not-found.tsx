'use client'

import { Box, Typography, Button } from '@mui/material'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

export default function NotFound() {
  const t = useTranslations('common.errors')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 12 }}>
      <Typography variant="h2">404</Typography>
      <Typography color="text.secondary">{t('notFound')}</Typography>
      <Button component={Link} href="/" variant="contained">
        {t('backHome')}
      </Button>
    </Box>
  )
}
