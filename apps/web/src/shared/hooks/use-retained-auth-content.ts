'use client'

import { useEffect, useState } from 'react'

export function useRetainedAuthContent(
  authorized: boolean,
  unavailable: boolean,
  loading: boolean,
): boolean {
  const [previouslyAuthorized, setPreviouslyAuthorized] = useState(authorized)
  useEffect(() => {
    if (authorized) setPreviouslyAuthorized(true)
    else if (!unavailable && !loading) setPreviouslyAuthorized(false)
  }, [authorized, unavailable, loading])
  return authorized || (previouslyAuthorized && (unavailable || loading))
}
