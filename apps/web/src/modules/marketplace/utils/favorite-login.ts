import { saveFavoriteSearchParam } from '../config/favorites'

function toRelativeHref(url: URL) {
  return `${url.pathname}${url.search}${url.hash}`
}

export function buildFavoriteLoginCallback(currentHref: string, propertyId: string) {
  const url = new URL(currentHref)
  url.searchParams.set(saveFavoriteSearchParam, propertyId)
  return toRelativeHref(url)
}

export function removeSaveFavoriteParam(currentHref: string) {
  const url = new URL(currentHref)
  url.searchParams.delete(saveFavoriteSearchParam)
  return toRelativeHref(url)
}
