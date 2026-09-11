import type { LocalizedHref } from '@shared/types/localized-href'

export type FooterColumn = {
  title: string
  links: Array<{
    label: string
    href: LocalizedHref
  }>
}
