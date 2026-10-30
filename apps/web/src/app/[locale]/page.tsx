import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

import { ScopedMessages } from '@/i18n/scoped-messages'
import { publicMessageNamespaces } from '@/i18n/message-selection'
import { publicMetadata } from '@/i18n/seo'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'

import { HomePage } from '@modules/marketplace'
import { marketplaceQueryKeys } from '@modules/marketplace/config/marketplace-query-keys'
import { featuredPropertiesCount, defaultHomePurpose } from '@modules/marketplace/config/home'
import { marketplaceContainer } from '@server/marketplace/container'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  return publicMetadata(locale, '/')
}

function asJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

async function recentProperties(page: number) {
  const { items, totalCount, pageSize } =
    await marketplaceContainer.searchPropertiesUseCase.execute({
      sortBy: 'recent',
      purpose: defaultHomePurpose,
      page,
      pageSize: featuredPropertiesCount,
    })

  return asJson({ properties: items, totalCount, page, pageSize })
}

export default async function HomeRoute() {
  const queryClient = new QueryClient()
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: marketplaceQueryKeys.recent(1, featuredPropertiesCount),
      queryFn: () => recentProperties(1),
    }),
    queryClient.prefetchQuery({
      queryKey: marketplaceQueryKeys.recent(2, featuredPropertiesCount),
      queryFn: () => recentProperties(2),
    }),
    queryClient.prefetchQuery({
      queryKey: marketplaceQueryKeys.stats(),
      queryFn: () => marketplaceContainer.getMarketplaceStatsUseCase.execute(),
    }),
  ])

  return (
    <ScopedMessages namespaces={publicMessageNamespaces}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <HomePage />
      </HydrationBoundary>
    </ScopedMessages>
  )
}
