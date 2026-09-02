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
    mode: 'always',
    prefixes: {
      'pt-BR': '/pt',
      'en-US': '/en',
      'es-ES': '/es',
    },
  },
  pathnames: {
    '/': '/',
    '/login': '/login',
    '/register': '/register',
    '/register/details': '/register/details',
    '/forgot-password': '/forgot-password',
    '/backoffice': '/backoffice',
    '/backoffice/admins': '/backoffice/admins',
    '/backoffice/admins/[id]': '/backoffice/admins/[id]',
    '/backoffice/admins/new': '/backoffice/admins/new',
    '/backoffice/login': '/backoffice/login',
    '/crm': '/crm',
    '/crm/contacts': '/crm/contacts',
    '/crm/opportunities/[id]': '/crm/opportunities/[id]',
    '/crm/proposals': '/crm/proposals',
    '/dashboard': '/dashboard',
    '/dashboard/agenda': '/dashboard/agenda',
    '/dashboard/finance': '/dashboard/finance',
    '/dashboard/leads': '/dashboard/leads',
    '/dashboard/properties': '/dashboard/properties',
    '/dashboard/properties/[id]': '/dashboard/properties/[id]',
    '/dashboard/properties/new': '/dashboard/properties/new',
    '/dashboard/proposals': '/dashboard/proposals',
    '/dashboard/public-profile': '/dashboard/public-profile',
    '/dashboard/public-profile/agency': '/dashboard/public-profile/agency',
    '/platform': '/platform',
    '/platform/admins/new': '/platform/admins/new',
    '/platform/login': '/platform/login',
    '/platform/tenants/[id]': '/platform/tenants/[id]',
    '/platform/tenants/new': '/platform/tenants/new',
    '/public-profile/agency/edit-preview': '/public-profile/agency/edit-preview',
    '/public-profile/edit-preview': '/public-profile/edit-preview',
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
