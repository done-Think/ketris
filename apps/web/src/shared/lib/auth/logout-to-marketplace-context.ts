'use client'

import { createContext } from 'react'

export const LogoutToMarketplaceContext = createContext<(() => Promise<void>) | null>(null)
