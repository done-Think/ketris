'use client'

import { useCallback, useState, type MouseEvent } from 'react'
import { Button, IconButton } from '@mui/material'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import {
  useFavoritePropertyIds,
  useSaveFavoriteAfterLogin,
  useToggleFavoriteProperty,
} from '../../hooks/use-favorite-properties'
import type { FavoriteButtonProps } from '../../types/favorite-property'
import { styles } from '../../styles/favorite-button.styles'
import { FavoriteLoginDialog } from './FavoriteLoginDialog'

export function FavoriteButton({ propertyId, variant }: FavoriteButtonProps) {
  const t = useTranslations('marketplace.favorites')
  const { status } = useSession()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const favoriteIds = useFavoritePropertyIds()
  const { mutate, isPending, variables } = useToggleFavoriteProperty()
  const favorite = isPending && variables ? variables.favorite : favoriteIds.has(propertyId)
  const saveAfterLogin = useCallback(
    () => mutate({ propertyId, favorite: true }),
    [mutate, propertyId],
  )

  useSaveFavoriteAfterLogin({ propertyId, onSave: saveAfterLogin })

  function handleClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (status !== 'authenticated') {
      setIsLoginOpen(true)
      return
    }
    mutate({ propertyId, favorite: !favorite })
  }

  const Icon = favorite ? FavoriteIcon : FavoriteBorderOutlinedIcon
  const disabled = status === 'loading'

  return (
    <>
      {variant === 'card' ? (
        <IconButton
          aria-label={t(favorite ? 'removeLabel' : 'addLabel')}
          aria-pressed={favorite}
          disabled={disabled}
          onClick={handleClick}
          sx={styles.cardButton}
        >
          <Icon sx={styles.cardIcon} />
        </IconButton>
      ) : (
        <Button
          startIcon={<Icon />}
          variant="outlined"
          color={favorite ? 'primary' : 'secondary'}
          aria-pressed={favorite}
          disabled={disabled}
          onClick={handleClick}
        >
          {t(favorite ? 'saved' : 'save')}
        </Button>
      )}
      {isLoginOpen ? (
        <FavoriteLoginDialog propertyId={propertyId} onClose={() => setIsLoginOpen(false)} />
      ) : null}
    </>
  )
}
