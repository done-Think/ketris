import type { ReactNode } from 'react'

import { privateMetadata } from '@/i18n/seo'

export const metadata = privateMetadata

export default function ScopedLayout({ children }: { children: ReactNode }) {
  return children
}
