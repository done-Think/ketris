import type { PropertyBreadcrumbOriginType } from './property-detail'

export type PublicProfileSidebarProps = {
  accentColor: string
  hoverColor: string
  href: string
  sourceType: PropertyBreadcrumbOriginType
  linkDescription: string
  phone: string
  email: string
  facts: Array<{
    label: string
    value: string
  }>
}
