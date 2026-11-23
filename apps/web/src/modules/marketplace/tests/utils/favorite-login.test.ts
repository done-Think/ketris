import { describe, expect, it } from 'vitest'

import { buildFavoriteLoginCallback, removeSaveFavoriteParam } from '../../utils/favorite-login'

describe('favorite login callback', () => {
  it('keeps the current page and asks it to save the property after login', () => {
    expect(
      buildFavoriteLoginCallback('https://ketris.test/pt/imoveis/p1?purpose=rent#mapa', 'p1'),
    ).toBe('/pt/imoveis/p1?purpose=rent&saveFavorite=p1#mapa')
  })

  it('removes only the save request from the address', () => {
    expect(
      removeSaveFavoriteParam('https://ketris.test/pt/imoveis/p1?purpose=rent&saveFavorite=p1'),
    ).toBe('/pt/imoveis/p1?purpose=rent')
  })
})
