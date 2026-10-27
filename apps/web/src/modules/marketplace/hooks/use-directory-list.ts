'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { useDebouncedValue } from '@shared/hooks/use-debounced-value'

import type { UseDirectoryListParams, UseDirectoryListResult } from '../types/directory'

export function useDirectoryList<TApi, TItem>({
  queryKey,
  fetchPage,
  toItem,
  pageSize,
}: UseDirectoryListParams<TApi, TItem>): UseDirectoryListResult<TItem> {
  const [search, setSearch] = useState('')
  const q = useDebouncedValue(search.trim(), 300)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const query = useInfiniteQuery({
    queryKey: queryKey({ q, pageSize }),
    queryFn: ({ pageParam }) => fetchPage({ q: q || undefined, page: pageParam, pageSize }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.totalCount ? last.page + 1 : undefined,
  })
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void fetchNextPage()
      },
      { rootMargin: '360px 0px' },
    )
    observer.observe(element)

    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const pages = query.data?.pages ?? []

  return {
    items: pages.flatMap((page) => page.items.map(toItem)),
    totalCount: pages[0]?.totalCount ?? 0,
    hasMoreItems: Boolean(hasNextPage),
    isLoading: query.isLoading,
    isLoadingMore: isFetchingNextPage,
    isError: query.isError,
    loadMoreRef,
    search,
    setSearch,
  }
}
