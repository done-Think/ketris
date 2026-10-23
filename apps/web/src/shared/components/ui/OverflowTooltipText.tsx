'use client'

import { useEffect, useRef, useState } from 'react'
import { Tooltip, Typography } from '@mui/material'

import type { OverflowTooltipTextProps } from '@shared/types/overflow-tooltip-text'

export function OverflowTooltipText({ children, sx, ...props }: OverflowTooltipTextProps) {
  const textRef = useRef<HTMLSpanElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  function measureOverflow() {
    const element = textRef.current
    setIsTruncated(Boolean(element && element.scrollWidth > element.clientWidth))
  }

  useEffect(() => {
    measureOverflow()
    const element = textRef.current
    if (!element || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(measureOverflow)
    observer.observe(element)
    return () => observer.disconnect()
  }, [children])

  return (
    <Tooltip title={isTruncated ? children : ''} describeChild>
      <Typography
        {...props}
        component="span"
        ref={textRef}
        noWrap
        tabIndex={isTruncated ? 0 : undefined}
        onMouseEnter={measureOverflow}
        onFocus={measureOverflow}
        sx={[
          { display: 'block', minWidth: 0, maxWidth: '100%' },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
      </Typography>
    </Tooltip>
  )
}
