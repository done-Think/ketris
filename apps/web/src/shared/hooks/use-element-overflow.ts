'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useElementOverflow<TElement extends HTMLElement = HTMLElement>(
  contentKey?: string | null,
  layoutKey?: string,
) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const elementRef = useRef<TElement | null>(null)
  const [overflow, setOverflow] = useState(0)

  const measure = useCallback(() => {
    const container = containerRef.current
    const element = elementRef.current
    setOverflow(
      container && element
        ? Math.max(0, element.getBoundingClientRect().width - container.clientWidth)
        : 0,
    )
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    if (containerRef.current) observer?.observe(containerRef.current)
    if (elementRef.current) observer?.observe(elementRef.current)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure, contentKey, layoutKey])

  return { containerRef, elementRef, overflow, measure }
}
