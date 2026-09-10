import { redirect } from 'next/navigation'

import { getLocalePathPrefix } from '@/i18n/locale-prefix'
import { defaultLocale } from '@/i18n/routing'

export default function NotFound() {
  redirect(getLocalePathPrefix(defaultLocale))
}
