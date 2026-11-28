'use client'

import { Button } from '@mui/material'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'

import {
  useFavoritePropertyIds,
  useToggleFavoriteProperty,
} from '../../hooks/use-favorite-properties'
import type { FavoriteButtonProps } from '../../types/favorite-property'

export function FavoriteButton({ propertyId }: FavoriteButtonProps) {
  const t = useTranslations('marketplace.favorites')
  const router = useRouter()
  const { status } = useSession()
  const favoriteIds = useFavoritePropertyIds()
  const { mutate, isPending, variables } = useToggleFavoriteProperty()
  const favorite = isPending && variables ? variables.favorite : favoriteIds.has(propertyId)
  const Icon = favorite ? FavoriteIcon : FavoriteBorderOutlinedIcon

  function handleClick() {
    if (status === 'authenticated') {
      mutate({ propertyId, favorite: !favorite })
      return
    }
    const callbackUrl = `${window.location.pathname}${window.location.search}`
    router.push({ pathname: '/login', query: { callbackUrl } })
  }

  return (
    <Button
      startIcon={<Icon />}
      variant="outlined"
      color={favorite ? 'primary' : 'secondary'}
      aria-pressed={favorite}
      disabled={status === 'loading'}
      onClick={handleClick}
    >
      {t(favorite ? 'saved' : 'save')}
    </Button>
  )
}
