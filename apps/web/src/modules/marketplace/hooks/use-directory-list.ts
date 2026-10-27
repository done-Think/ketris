'use client'

import { useEffect, useMemo, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'

import { useDebouncedValue } from '@shared/hooks'

import { createDirectorySearchFormSchema } from '../schemas/directory-search-schema'
import type {
  DirectorySearchFormValues,
  UseDirectorySearchResult,
  UseLoadMoreOnScrollParams,
} from '../types/directory'

// The directory search box; the server filters, so the typed text is debounced before querying.
export function useDirectorySearch(): UseDirectorySearchResult {
  const t = useTranslations('marketplace.directory.errors')
  const schema = useMemo(() => createDirectorySearchFormSchema((key) => t(key)), [t])
  const { register, watch } = useForm<DirectorySearchFormValues>({
    defaultValues: { searchQuery: '' },
    resolver: zodResolver(schema),
  })
  const search = useDebouncedValue(watch('searchQuery').trim(), 300)

  return { register, search }
}

// Calls `onLoadMore` when the returned element scrolls close to the viewport.
export function useLoadMoreOnScroll({ enabled, onLoadMore }: UseLoadMoreOnScrollParams) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const onLoadMoreRef = useRef(onLoadMore)

  // Keeps the latest callback without recreating the observer on every render.
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  })

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element || !enabled || !window.IntersectionObserver) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onLoadMoreRef.current()
      },
      { rootMargin: '360px 0px' },
    )
    observer.observe(element)

    return () => observer.disconnect()
  }, [enabled])

  return loadMoreRef
}
