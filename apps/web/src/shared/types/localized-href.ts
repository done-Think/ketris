import type { ComponentProps } from 'react'

import { Link } from '@/i18n/navigation'

export type LocalizedHref = ComponentProps<typeof Link>['href']

export type LocalizedStringHref = Extract<LocalizedHref, string>
