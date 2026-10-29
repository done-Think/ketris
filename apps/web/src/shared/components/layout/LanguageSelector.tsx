'use client'

import { styles } from '@shared/styles/language-selector.styles'

import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { Box, Button, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { getCurrentRouteHref, getLocaleChangePathname } from '@/i18n/current-route'
import { usePathname } from '@/i18n/navigation'
import { syncClientLocaleCookie } from '@/i18n/locale-cookie'
import type { AppLocale } from '@/i18n/types/locale.types'
import { componentText } from '@shared/theme/tokens'
import type { LanguageOption, LanguageSelectorProps } from '@shared/types/language-selector'

export function LanguageSelector(props: LanguageSelectorProps) {
  return (
    <Suspense fallback={null}>
      <LanguageSelectorContent {...props} />
    </Suspense>
  )
}

function LanguageSelectorContent({ variant = 'profile' }: LanguageSelectorProps) {
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const params = useParams() ?? {}
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('marketplace.profile')
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const isHeader = variant === 'header'
  const currentLocale = locale
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
    const href = getCurrentRouteHref(
      pathname,
      params,
      new URLSearchParams(searchParams?.toString() ?? ''),
    )
    setAnchor(null)
    // Cached client navigation can skip middleware; preserve both locale cookie and fragment.
    syncClientLocaleCookie(nextLocale)
    router.replace(getLocaleChangePathname(nextLocale, href, window.location.hash))
  }

  return (
    <>
      <Button
        type="button"
        onClick={(event) => setAnchor(event.currentTarget)}
        endIcon={<KeyboardArrowDownRoundedIcon fontSize="small" />}
        fullWidth={!isHeader}
        sx={styles.button(isHeader)}
      >
        <Stack
          component="span"
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={styles.stack}
        >
          {!isHeader ? <Box component="span">{t('language')}</Box> : null}
          <Stack component="span" direction="row" alignItems="center" spacing={0.75}>
            <Box component="img" src={selectedLanguage.flagSrc} alt="" sx={styles.box} />
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
            sx: styles.paper,
          },
        }}
      >
        {languageOptions.map((language) => (
          <MenuItem
            key={language.locale}
            selected={currentLocale === language.locale}
            onClick={() => handleLanguageSelect(language.locale)}
            sx={styles.menuItem}
          >
            <Box component="img" src={language.flagSrc} alt="" sx={styles.box2} />
            <Typography sx={componentText.modalSubtitle}>{language.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
