'use client'

import { useState } from 'react'
import { Box, Button, Menu, MenuItem, Stack, Typography } from '@mui/material'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useSearchParams } from 'next/navigation'

import { localeCookieMaxAge, localeCookieName, localeCookiePath } from '@/i18n/locale-cookie'
import { getLocaleFromPathname, getLocalizedPathnameForLocale } from '@/i18n/locale-prefix'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { LanguageOption, LanguageSelectorProps } from '@shared/types/language-selector'
import { alpha, componentText, radius, shadows } from '@shared/theme/tokens'

export function LanguageSelector({ variant = 'profile' }: LanguageSelectorProps) {
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('marketplace.profile')
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const isHeader = variant === 'header'
  const currentLocale = getLocaleFromPathname(pathname) ?? locale
  const languageOptions: LanguageOption[] = [
    {
      locale: 'pt-BR',
      label: t('languages.ptBR'),
      shortLabel: 'BR',
      flagSrc: 'https://flagcdn.com/w40/br.png',
    },
    {
      locale: 'en-US',
      label: t('languages.en'),
      shortLabel: 'US',
      flagSrc: 'https://flagcdn.com/w40/us.png',
    },
    {
      locale: 'es-ES',
      label: t('languages.es'),
      shortLabel: 'ES',
      flagSrc: 'https://flagcdn.com/w40/es.png',
    },
  ]
  const selectedLanguage =
    languageOptions.find((language) => language.locale === currentLocale) ?? languageOptions[0]

  const handleLanguageSelect = (nextLocale: AppLocale) => {
    const nextPathname = getLocalizedPathnameForLocale(window.location.pathname, nextLocale)
    const queryString = searchParams.toString()
    const nextHref = queryString ? `${nextPathname}?${queryString}` : nextPathname

    document.cookie = `${localeCookieName}=${nextLocale}; Path=${localeCookiePath}; SameSite=Lax; Max-Age=${localeCookieMaxAge}`
    setAnchor(null)
    window.location.assign(nextHref)
  }

  return (
    <>
      <Button
        type="button"
        onClick={(event) => setAnchor(event.currentTarget)}
        startIcon={<TranslateOutlinedIcon fontSize="small" />}
        endIcon={<KeyboardArrowDownRoundedIcon fontSize="small" />}
        fullWidth={!isHeader}
        sx={{
          justifyContent: 'flex-start',
          minHeight: 42,
          borderRadius: `${radius.sm}px`,
          color: 'text.primary',
          px: isHeader ? 1.3 : undefined,
          minWidth: isHeader ? 88 : undefined,
          ...componentText.resetButtonText,
          ...componentText.modalAction,
          '& .MuiButton-endIcon': {
            ml: 'auto',
          },
          '&:hover': {
            bgcolor: alpha.magenta[8],
            color: 'primary.main',
          },
        }}
      >
        <Stack
          component="span"
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: '100%', minWidth: 0 }}
        >
          {!isHeader ? <Box component="span">{t('language')}</Box> : null}
          <Stack component="span" direction="row" alignItems="center" spacing={0.75}>
            <Box
              component="img"
              src={selectedLanguage.flagSrc}
              alt=""
              sx={{
                width: 22,
                height: 22,
                borderRadius: radius.full,
                objectFit: 'cover',
                boxShadow: `0 0 0 1px ${alpha.graphite[10]}`,
              }}
            />
            <Box component="span">{selectedLanguage.shortLabel}</Box>
          </Stack>
        </Stack>
      </Button>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        disableScrollLock
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          list: {
            'aria-label': t('language'),
          },
          paper: {
            sx: {
              mt: 0.75,
              borderRadius: `${radius.sm}px`,
              boxShadow: shadows.popover,
              minWidth: 176,
            },
          },
        }}
      >
        {languageOptions.map((language) => (
          <MenuItem
            key={language.locale}
            selected={currentLocale === language.locale}
            onClick={() => handleLanguageSelect(language.locale)}
            sx={{ minHeight: 40, gap: 1.2 }}
          >
            <Box
              component="img"
              src={language.flagSrc}
              alt=""
              sx={{
                width: 22,
                height: 22,
                borderRadius: radius.full,
                objectFit: 'cover',
                boxShadow: `0 0 0 1px ${alpha.graphite[10]}`,
              }}
            />
            <Typography sx={componentText.modalSubtitle}>{language.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
