import type { ReactNode } from 'react'

import type { SessionStatus } from './session.types'

export interface ChildrenProps {
  children: ReactNode
}

export interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}

export interface StatusBadgeProps {
  status: SessionStatus
}

export type StepProgressTone = 'light' | 'dark'

export interface StepProgressProps {
  current: number
  total: number
  label: string
  tone?: StepProgressTone
}

export interface ErrorNoticeProps {
  error: unknown
}

export interface BrandMarkProps {
  size?: 'sm' | 'md'
}
