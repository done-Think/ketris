'use client'

import { useEffect, useMemo, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { directorySearchFormSchema } from '../schemas/directory-search-schema'
import type {
  DirectorySearchFormValues,
  UseDirectoryListParams,
  UseDirectoryListResult,
} from '../types/directory'
import { normalizeSearchText } from '../utils/search'

export function useDirectoryList<TItem>({
  getSearchableText,
  initialCount,
  items,
  pageSize,
}: UseDirectoryListParams<TItem>): UseDirectoryListResult<TItem> {
  const { getValues, register, setValue, watch } = useForm<DirectorySearchFormValues>({
    defaultValues: {
      isLoadingMore: false,
      searchQuery: '',
      visibleCount: initialCount,
    },
    resolver: zodResolver(directorySearchFormSchema),
  })
  const { isLoadingMore, searchQuery, visibleCount } = watch()
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery.trim())

    return items.filter((item) => {
      const searchableText = normalizeSearchText(getSearchableText(item))

      return !normalizedQuery || searchableText.includes(normalizedQuery)
    })
  }, [getSearchableText, items, searchQuery])
  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount],
  )
  const hasMoreItems = visibleCount < filteredItems.length

  useEffect(() => {
    setValue('visibleCount', initialCount)
  }, [initialCount, searchQuery, setValue])

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current
    if (!loadMoreElement || !hasMoreItems || isLoadingMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return

        setValue('isLoadingMore', true)
        window.setTimeout(() => {
          setValue(
            'visibleCount',
            Math.min(getValues('visibleCount') + pageSize, filteredItems.length),
          )
          setValue('isLoadingMore', false)
        }, 420)
      },
      { rootMargin: '360px 0px' },
    )

    observer.observe(loadMoreElement)

    return () => observer.disconnect()
  }, [filteredItems.length, getValues, hasMoreItems, isLoadingMore, pageSize, setValue])

  return {
    filteredItems,
    hasMoreItems,
    isLoadingMore,
    loadMoreRef,
    register,
    visibleItems,
  }
}
