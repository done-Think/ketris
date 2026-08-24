import { defineRouting } from 'next-intl/routing'

import {
  localeCookieMaxAge,
  localeCookieName,
  localeCookiePath,
  localeCookieSameSite,
} from './locale-cookie'
import type { AppLocale } from './types/locale.types'

export const locales = ['pt-BR', 'en-US', 'es-ES'] as const
export const defaultLocale: AppLocale = 'pt-BR'

export const routing = defineRouting({
  locales,
  defaultLocale,
  localeDetection: true,
  localeCookie: {
    name: localeCookieName,
    maxAge: localeCookieMaxAge,
    path: localeCookiePath,
    sameSite: localeCookieSameSite,
  },
  localePrefix: {
    mode: 'as-needed',
    prefixes: {
      'en-US': '/en',
      'es-ES': '/es',
    },
  },
  pathnames: {
    '/': '/',
    '/login': '/login',
    '/register': '/register',
    '/forgot-password': '/forgot-password',
    '/properties': {
      'pt-BR': '/imoveis',
      'en-US': '/properties',
      'es-ES': '/inmuebles',
    },
    '/properties/[id]': {
      'pt-BR': '/imoveis/[id]',
      'en-US': '/properties/[id]',
      'es-ES': '/inmuebles/[id]',
    },
    '/brokers': {
      'pt-BR': '/corretores',
      'en-US': '/brokers',
      'es-ES': '/corredores',
    },
    '/brokers/[id]': {
      'pt-BR': '/corretores/[id]',
      'en-US': '/brokers/[id]',
      'es-ES': '/corredores/[id]',
    },
    '/agencies': {
      'pt-BR': '/imobiliarias',
      'en-US': '/agencies',
      'es-ES': '/inmobiliarias',
    },
    '/agencies/[id]': {
      'pt-BR': '/imobiliarias/[id]',
      'en-US': '/agencies/[id]',
      'es-ES': '/inmobiliarias/[id]',
    },
  },
})

export function isAppLocale(locale: string | undefined): locale is AppLocale {
  return locales.includes(locale as AppLocale)
}
