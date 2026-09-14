import type { LocalizedHref } from './localized-href'

export type SiteFooterColumn = {
  title: string
  links: Array<{
    label: string
    href: LocalizedHref
  }>
}

export type SiteFooterProps = {
  columns: SiteFooterColumn[]
  legalLinks: ReadonlyArray<{
    label: string
    href: LocalizedHref
  }>
}
