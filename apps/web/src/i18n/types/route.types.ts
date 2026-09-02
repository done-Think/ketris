import type { ReactNode } from 'react'

export type LocaleRouteParams = {
  locale: string
}

export type LocaleRoutePageProps<
  Params extends Record<string, string | string[]> = Record<never, never>,
  SearchParams extends Record<string, string | string[] | undefined> = Record<
    string,
    string | string[] | undefined
  >,
> = {
  params: Promise<LocaleRouteParams & Params>
  searchParams?: Promise<SearchParams>
}

export type LocaleLayoutProps = {
  children: ReactNode
  params: Promise<LocaleRouteParams>
}
