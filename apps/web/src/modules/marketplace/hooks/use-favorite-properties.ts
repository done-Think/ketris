'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { extractErrorMessage } from '@shared/utils/error-message'

import { saveFavoriteSearchParam } from '../config/favorites'
import { marketplaceQueryKeys } from '../config/marketplace-query-keys'
import { favoritePropertiesService } from '../services/favorite-properties-service'
import type {
  FavoritePropertiesResponse,
  FavoriteToggleInput,
  SaveFavoriteAfterLoginOptions,
} from '../types/favorite-property'
import { removeSaveFavoriteParam } from '../utils/favorite-login'
import { useMarketplaceActorKey } from './use-marketplace-actor-key'

export function useFavoriteProperties() {
  const actorKey = useMarketplaceActorKey()
  const { status } = useSession()

  return useQuery({
    queryKey: marketplaceQueryKeys.favorites(actorKey),
    queryFn: () => favoritePropertiesService.list(),
    enabled: status === 'authenticated',
  })
}

export function useFavoritePropertyIds() {
  const { data } = useFavoriteProperties()

  return useMemo(
    () => new Set(data?.favorites.map((favorite) => favorite.propertyId) ?? []),
    [data],
  )
}

export function useToggleFavoriteProperty() {
  const actorKey = useMarketplaceActorKey()
  const queryClient = useQueryClient()
  const t = useTranslations('marketplace.favorites')
  const { enqueueSnackbar } = useSnackbar()

  return useMutation({
    mutationFn: async ({ propertyId, favorite }: FavoriteToggleInput) => {
      if (favorite) await favoritePropertiesService.save(propertyId)
      else await favoritePropertiesService.remove(propertyId)
    },
    onError: (error) => {
      const limit = queryClient.getQueryData<FavoritePropertiesResponse>(
        marketplaceQueryKeys.favorites(actorKey),
      )?.limit
      enqueueSnackbar(
        extractErrorMessage(error, t('errors.generic'), {
          PROPERTY_NOT_FOUND: t('errors.unavailable'),
          ...(limit && { FAVORITE_LIMIT_REACHED: t('errors.limitReached', { limit }) }),
        }),
        { variant: 'error' },
      )
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.favorites(actorKey) }),
  })
}

export function useSaveFavoriteAfterLogin({ propertyId, onSave }: SaveFavoriteAfterLoginOptions) {
  const searchParams = useSearchParams()
  const { status } = useSession()
  const handled = useRef(false)
  const requested =
    status === 'authenticated' && searchParams.get(saveFavoriteSearchParam) === propertyId

  useEffect(() => {
    if (!requested || handled.current) return
    handled.current = true
    onSave()
    window.history.replaceState(
      window.history.state,
      '',
      removeSaveFavoriteParam(window.location.href),
    )
  }, [requested, onSave])
}
