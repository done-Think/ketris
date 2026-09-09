import { describe, expect, it } from 'vitest'

import {
  buildPropertyDetailsHref,
  buildPropertyDetailsHrefFromSource,
} from './property-details-link'

describe('buildPropertyDetailsHref', () => {
  it('preserves the search purpose in property detail links', () => {
    expect(
      buildPropertyDetailsHref({
        href: '/imoveis/apartamento-garden-remodelado',
        purpose: 'alugar',
      }),
    ).toBe('/imoveis/apartamento-garden-remodelado?purpose=alugar')
  })

  it('infers rent purpose from monthly property prices', () => {
    expect(
      buildPropertyDetailsHrefFromSource({
        href: '/imoveis/apartamento-jardins',
        price: 'R$ 4.800 / mês',
      }),
    ).toBe('/imoveis/apartamento-jardins?purpose=alugar')
  })

  it('infers buy purpose from sale property prices', () => {
    expect(
      buildPropertyDetailsHrefFromSource({
        href: '/imoveis/apartamento-jardins-venda',
        price: 'R$ 1.420.000',
      }),
    ).toBe('/imoveis/apartamento-jardins-venda?purpose=comprar')
  })
})
