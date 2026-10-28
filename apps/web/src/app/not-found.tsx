import { redirect } from 'next/navigation'

import { getPathname } from '@/i18n/navigation'
import { defaultLocale } from '@/i18n/routing'

export default function NotFound() {
  redirect(getPathname({ href: '/', locale: defaultLocale }))
}
