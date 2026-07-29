import type { ReactNode } from 'react'

// Layout do marketplace público (SSR/ISR para SEO).
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
